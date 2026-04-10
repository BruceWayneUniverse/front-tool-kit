// Timestamp Tool
(function () {
  dayjs.extend(dayjs_plugin_utc);
  dayjs.extend(dayjs_plugin_timezone);

  // ── Timezone config ──────────────────────────────────────────
  var TZ_LABELS = {
    'Asia/Shanghai':    '北京 utc+8',
    'UTC':              'UTC utc+0',
    'America/New_York': '纽约 utc-5',
    'Europe/London':    '伦敦 utc+0',
  };

  // ── Unit multipliers (relative to seconds) ───────────────────
  var UNIT_ZEROS = { s: 0, ms: 3 };

  // ── State ─────────────────────────────────────────────────────
  var currentUnit = 'ms';
  var currentTz   = 'Asia/Shanghai';
  var timerRunning = false;
  var timerId = null;

  // ── DOM refs ──────────────────────────────────────────────────
  var elDateInput   = document.getElementById('ts-date-input');
  var elDateResult  = document.getElementById('ts-date-result');
  var elStampInput  = document.getElementById('ts-stamp-input');
  var elStampResult = document.getElementById('ts-stamp-result');
  var elCurrentVal  = document.getElementById('ts-current-value');
  var elToggleBtn   = document.getElementById('ts-toggle-btn');
  var elResetBtn    = document.getElementById('ts-reset-btn');
  var elTzLabel1    = document.getElementById('ts-tz-label1');
  var elTzLabel2    = document.getElementById('ts-tz-label2');
  var elTimezone    = document.getElementById('ts-timezone');
  var elDateCopyBtn    = document.getElementById('ts-date-copy-btn');
  var elStampCopyBtn   = document.getElementById('ts-stamp-copy-btn');
  var elCurrentCopyBtn = document.getElementById('ts-current-copy-btn');

  // ── Helpers ───────────────────────────────────────────────────
  function zeros(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += '0';
    return s;
  }

  // Whole-second value displayed in current unit (append trailing zeros)
  function secToUnit(sec) {
    return String(Math.floor(sec)) + zeros(UNIT_ZEROS[currentUnit]);
  }

  // Unit value → seconds
  function unitToSec(val) {
    var n = Number(val);
    if (!isFinite(n)) return NaN;
    var z = UNIT_ZEROS[currentUnit];
    if (z === 0) return n;
    // Divide by 10^z
    return n / Math.pow(10, z);
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent;
      btn.textContent = '已复制!';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    });
  }

  function updateTzLabels() {
    var label = '（' + TZ_LABELS[currentTz] + '）';
    elTzLabel1.textContent = label;
    elTzLabel2.textContent = label;
  }

  // ── Live current timestamp ────────────────────────────────────
  function tick() {
    elCurrentVal.textContent = secToUnit(Date.now() / 1000);
  }

  function startTimer() {
    if (timerRunning) return;
    tick();
    timerId = setInterval(tick, 1000);
    timerRunning = true;
    elToggleBtn.textContent = '⏸ 暂停';
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
    timerRunning = false;
    elToggleBtn.textContent = '▶ 继续';
  }

  // ── Conversions ───────────────────────────────────────────────

  // Date string → timestamp in current unit
  function convertDateToStamp() {
    var raw = elDateInput.value.trim();
    if (!raw) {
      elDateResult.textContent = '-';
      elDateCopyBtn.style.display = 'none';
      return;
    }
    try {
      var d = (currentTz === 'UTC')
        ? dayjs.utc(raw)
        : dayjs.tz(raw, currentTz);
      if (!d.isValid()) throw new Error();
      elDateResult.textContent = secToUnit(d.unix());
      elDateCopyBtn.style.display = '';
    } catch (_) {
      elDateResult.textContent = '格式错误';
      elDateCopyBtn.style.display = 'none';
    }
  }

  // Timestamp in current unit → date string
  function convertStampToDate() {
    var raw = elStampInput.value.trim();
    if (!raw) {
      elStampResult.textContent = '-';
      elStampCopyBtn.style.display = 'none';
      return;
    }
    try {
      var sec = unitToSec(raw);
      if (isNaN(sec)) throw new Error();
      var d = (currentTz === 'UTC')
        ? dayjs.unix(sec).utc()
        : dayjs.unix(sec).tz(currentTz);
      elStampResult.textContent = d.format('YYYY-MM-DD HH:mm:ss');
      elStampCopyBtn.style.display = '';
    } catch (_) {
      elStampResult.textContent = '格式错误';
      elStampCopyBtn.style.display = 'none';
    }
  }

  // ── Unit buttons ──────────────────────────────────────────────
  document.querySelectorAll('.ts-unit-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.ts-unit-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentUnit = btn.dataset.unit;
      tick();
      convertDateToStamp();
      convertStampToDate();
    });
  });

  // ── Timezone select ───────────────────────────────────────────
  elTimezone.addEventListener('change', function () {
    currentTz = elTimezone.value;
    updateTzLabels();
    convertDateToStamp();
    convertStampToDate();
  });

  // ── Input listeners ───────────────────────────────────────────
  elDateInput.addEventListener('input', convertDateToStamp);
  elDateInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') convertDateToStamp();
  });

  elStampInput.addEventListener('input', convertStampToDate);
  elStampInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') convertStampToDate();
  });

  // ── Toggle timer ──────────────────────────────────────────────
  elToggleBtn.addEventListener('click', function () {
    if (timerRunning) stopTimer(); else startTimer();
  });

  // ── Reset ─────────────────────────────────────────────────────
  elResetBtn.addEventListener('click', function () {
    elDateInput.value  = '';
    elStampInput.value = '';
    elDateResult.textContent  = '';
    elStampResult.textContent = '';
  });

  // ── Copy buttons ─────────────────────────────────────────────
  elDateCopyBtn.addEventListener('click', function () {
    copyText(elDateResult.textContent, elDateCopyBtn);
  });
  elStampCopyBtn.addEventListener('click', function () {
    copyText(elStampResult.textContent, elStampCopyBtn);
  });
  elCurrentCopyBtn.addEventListener('click', function () {
    copyText(elCurrentVal.textContent, elCurrentCopyBtn);
  });

  // ── Init ──────────────────────────────────────────────────────
  updateTzLabels();
  startTimer();
})();
