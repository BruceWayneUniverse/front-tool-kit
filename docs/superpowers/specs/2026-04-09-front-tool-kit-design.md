# Front Tool Kit — Chrome Extension Design Spec

**Date:** 2026-04-09  
**Status:** Approved

---

## Overview

A Chrome Extension (Manifest V3) popup that provides three developer utility tools in a tabbed interface: Timestamp Converter, JSON Parser, and Expression Calculator.

---

## Tech Stack

| Item | Choice |
|------|--------|
| Platform | Chrome Extension, Manifest V3 |
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Timezone handling | dayjs + dayjs/plugin/timezone + dayjs/plugin/utc |
| Expression parser | mathjs (avoids eval security issues) |
| Styling | Plain CSS (no UI library) |

---

## UI Design

- **Popup size:** 400px × 560px
- **Theme:** Professional blue (#2563eb), light background, standard developer tool style
- **Layout:** Fixed top TabBar with 3 tabs; content area below renders the active tool

### TabBar

Three tabs: 时间戳 / JSON / 计算器  
Active tab has blue underline and bold text. Tab state persists only within the popup session (no localStorage needed).

---

## Project Structure

```
front-tool-kit/
├── manifest.json
├── popup.html
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── main.tsx              # React entry, mounts <App />
│   ├── App.tsx               # TabBar + active tool router
│   ├── components/
│   │   ├── TabBar.tsx
│   │   └── tools/
│   │       ├── TimestampTool.tsx
│   │       ├── JsonTool.tsx
│   │       └── CalculatorTool.tsx
│   └── styles/
│       └── index.css
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Tool Specifications

### 1. Timestamp Tool (TimestampTool.tsx)

**Features:**
- Unix timestamp (seconds) → formatted datetime string
- Datetime string → Unix timestamp
- "当前时间" button: fills input with current Unix timestamp
- Timezone selector: UTC, Local (browser), Asia/Shanghai, America/New_York, Europe/London

**UI Flow:**
1. User enters a Unix timestamp or a datetime string in the input field
2. Selects target timezone from dropdown
3. Clicks "转换" button (or presses Enter) — result appears below
4. "当前时间" button populates the input with `Date.now() / 1000 | 0`
5. Copy button next to result

**Conversion logic:**
- Detect input type: if purely numeric → treat as Unix timestamp → format to datetime
- If contains `-` or `/` → treat as datetime string → parse and output Unix timestamp
- Use `dayjs.utc(val).tz(timezone).format('YYYY-MM-DD HH:mm:ss')`

---

### 2. JSON Tool (JsonTool.tsx)

**Features:**
- **Prettify**: parse input, re-serialize with 2-space indent
- **Minify**: parse input, re-serialize with no whitespace
- **Unescape**: strip `\"`, `\\n`, `\\t` escape sequences (handles double-encoded JSON)
- **Error display**: if JSON.parse fails, show red error message with description

**UI Flow:**
1. Input textarea (top, ~8 rows)
2. Button row: 格式化 / 压缩 / 去转义
3. Output textarea (bottom, ~8 rows) — read-only, with copy button
4. Error message shown inline below input if parse fails

**Unescape logic:**
- First attempt `JSON.parse(input)` to unwrap a JSON string (removes outer quotes and decodes escapes)
- If that fails, apply regex: replace `\"` → `"`, `\\n` → newline, `\\t` → tab, `\\\\` → `\`

---

### 3. Calculator Tool (CalculatorTool.tsx)

**Features:**
- Expression input: supports `+`, `-`, `*`, `/`, `^`, `()`, `sqrt()`, `sin()`, `cos()`, `pi`, `e`, etc.
- Evaluate on Enter or "=" button click
- Result displayed prominently below input
- Calculation history: last 10 expressions shown as a scrollable list; clicking a history item restores it to input

**UI Flow:**
1. Expression input field (full width)
2. "=" button (or Enter key)
3. Result display area
4. History list below (most recent first)

**Evaluation:** Use `mathjs.evaluate(expression)`. Wrap in try/catch — show error message on invalid input.

---

## Build & Load

```bash
npm install
npm run build       # outputs to dist/
```

Load as unpacked extension in Chrome:
1. Open `chrome://extensions`
2. Enable Developer Mode
3. "Load unpacked" → select `dist/` folder

**vite.config.ts** must set `build.rollupOptions.input` to `popup.html` and `build.outDir` to `dist`.

---

## Out of Scope

- Firefox support
- Side panel / new tab page
- Dark mode
- Settings persistence
- Tree view for JSON
- JSON Path query
- Scientific calculator button pad
