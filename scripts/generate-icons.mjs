/**
 * Generates toolbox-style PNG icons for the Chrome extension.
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync, copyFileSync } from 'fs';

function uint32BE(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function makeCRC(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = makeCRC(crcData);
  return Buffer.concat([uint32BE(data.length), typeBytes, data, uint32BE(crc)]);
}

function createPNG(size, pixels) {
  // pixels: Uint8Array of size*size*4 (RGBA)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.concat([
    uint32BE(size),
    uint32BE(size),
    Buffer.from([8, 6, 0, 0, 0]), // 8-bit RGBA
  ]);
  const ihdr = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + size * 4;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const pi = (y * size + x) * 4;
      raw[y * rowSize + 1 + x * 4] = pixels[pi];
      raw[y * rowSize + 2 + x * 4] = pixels[pi + 1];
      raw[y * rowSize + 3 + x * 4] = pixels[pi + 2];
      raw[y * rowSize + 4 + x * 4] = pixels[pi + 3];
    }
  }
  const idat = makeChunk('IDAT', deflateSync(raw));
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function drawToolbox(size) {
  const pixels = new Uint8Array(size * size * 4); // all transparent

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b; pixels[idx + 3] = a;
  }

  function fillRect(x1, y1, x2, y2, r, g, b, a = 255) {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        setPixel(x, y, r, g, b, a);
  }

  const s = size;

  // Blue toolbox colors
  const [bR, bG, bB] = [37,  99, 235];  // #2563eb body fill
  const [dR, dG, dB] = [30,  58, 138];  // #1e3a8a dark outline / divider
  const [hR, hG, hB] = [29,  78, 216];  // #1d4ed8 handle

  const ow = Math.max(1, Math.round(s * 0.07)); // outline / stroke width

  // ── Body ──────────────────────────────────────────────────────────────────
  const bx1 = Math.round(s * 0.06);
  const bx2 = s - 1 - Math.round(s * 0.06);
  const by1 = Math.round(s * 0.34);
  const by2 = s - 1 - Math.round(s * 0.06);

  fillRect(bx1, by1, bx2, by2, bR, bG, bB);

  // Body outline
  fillRect(bx1, by1,        bx2, by1 + ow - 1, dR, dG, dB); // top
  fillRect(bx1, by2 - ow + 1, bx2, by2,        dR, dG, dB); // bottom
  fillRect(bx1, by1,        bx1 + ow - 1, by2, dR, dG, dB); // left
  fillRect(bx2 - ow + 1, by1, bx2, by2,        dR, dG, dB); // right

  // Horizontal divider ~1/3 down the body
  const divY = by1 + Math.round((by2 - by1) * 0.33);
  fillRect(bx1, divY, bx2, divY + ow - 1, dR, dG, dB);

  // ── Handle ────────────────────────────────────────────────────────────────
  const hw  = Math.round(s * 0.44);
  const hx1 = Math.round((s - hw) / 2);
  const hx2 = hx1 + hw - 1;
  const hy1 = Math.round(s * 0.08);
  const hy2 = by1 - 1;
  const ht  = Math.max(1, Math.round(s * 0.11)); // handle thickness

  fillRect(hx1,          hy1, hx1 + ht - 1, hy2, hR, hG, hB); // left pillar
  fillRect(hx2 - ht + 1, hy1, hx2,          hy2, hR, hG, hB); // right pillar
  fillRect(hx1,          hy1, hx2, hy1 + ht - 1, hR, hG, hB); // top bar

  return pixels;
}

mkdirSync('public/icons', { recursive: true });
mkdirSync('icons', { recursive: true });

for (const size of [16, 48, 128]) {
  const png = createPNG(size, drawToolbox(size));
  writeFileSync(`public/icons/icon${size}.png`, png);
  copyFileSync(`public/icons/icon${size}.png`, `icons/icon${size}.png`);
  console.log(`Generated icon${size}.png`);
}
