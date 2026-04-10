(function () {
  var elInput        = document.getElementById('json-input');
  var elOutput       = document.getElementById('json-output');
  var elError        = document.getElementById('json-error');
  var elPrettify     = document.getElementById('json-prettify-btn');
  var elMinify       = document.getElementById('json-minify-btn');
  var elUnescape     = document.getElementById('json-unescape-btn');
  var elHistoryBtn   = document.getElementById('json-history-btn');
  var elCopy         = document.getElementById('json-copy-btn');
  var elParsePanel   = document.getElementById('json-parse-panel');
  var elHistoryPanel = document.getElementById('json-history-panel');
  var elHistoryList  = document.getElementById('json-history-list');

  // ── Syntax highlighter ────────────────────────────────────────
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function syntaxHighlight(json) {
    var escaped = escapeHtml(json);
    return escaped.replace(
      /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false)|(null)|([{}\[\]])|([,:])/g,
      function (match, key, str, num, bool, nil, bracket, punct) {
        if (key)     return '<span class="json-key">'   + key   + '</span>:';
        if (str)     return '<span class="json-str">'   + str   + '</span>';
        if (num)     return '<span class="json-num">'   + num   + '</span>';
        if (bool)    return '<span class="json-bool">'  + bool  + '</span>';
        if (nil)     return '<span class="json-null">'  + nil   + '</span>';
        if (bracket) return '<span class="json-punct">' + bracket + '</span>';
        if (punct)   return '<span class="json-punct">' + punct   + '</span>';
        return match;
      }
    );
  }

  // ── Error position helper ─────────────────────────────────────
  function fieldPathBefore(raw, pos) {
    var chunk = raw.slice(0, pos + 1);
    var keys = [];
    var re = /"((?:[^"\\]|\\.)*)"\s*:/g;
    var m;
    while ((m = re.exec(chunk)) !== null) {
      keys.push(m[1]);
    }
    if (keys.length === 0) return null;
    var trail = keys.slice(-3);
    var total = keys.length;
    return '第 ' + total + ' 个字段 "' + trail.join('" > "') + '" 附近';
  }

  function getErrorPos(e, raw) {
    var msg = e.message || String(e);
    var posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) return parseInt(posMatch[1], 10);
    var ffMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (ffMatch) {
      var line = parseInt(ffMatch[1], 10);
      var col  = parseInt(ffMatch[2], 10);
      var lines = raw.split('\n');
      var pos = 0;
      for (var i = 0; i < line - 1 && i < lines.length; i++) {
        pos += lines[i].length + 1;
      }
      return pos + col - 1;
    }
    return -1;
  }

  function getErrorHint(e, raw) {
    var pos = getErrorPos(e, raw);
    if (pos >= 0) {
      var hint = fieldPathBefore(raw, pos);
      if (hint) return '解析失败：' + hint + '出错';
    }
    return '解析失败：' + (e.message || String(e));
  }

  // ── Output helpers ────────────────────────────────────────────
  var _lastText = '';

  function setOutput(text) {
    _lastText = text;
    elOutput.innerHTML = syntaxHighlight(text);
  }

  function clearOutput() {
    _lastText = '';
    elOutput.innerHTML = '';
  }

  function clearError() {
    elError.textContent = '';
  }

  // ── History ───────────────────────────────────────────────────
  var HISTORY_KEY = 'ftk_json_history';
  var HISTORY_MAX = 10;

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function saveToHistory(raw, prettified) {
    var list = loadHistory();
    // skip duplicate of last entry
    if (list.length > 0 && list[0].raw === raw) return;
    list.unshift({ raw: raw, prettified: prettified, time: Date.now() });
    if (list.length > HISTORY_MAX) list = list.slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  }

  function formatAgo(ts) {
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60)   return diff + ' 秒前';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    return Math.floor(diff / 86400) + ' 天前';
  }

  function renderHistory() {
    var list = loadHistory();
    if (list.length === 0) {
      elHistoryList.innerHTML = '<div class="json-history-empty">暂无历史记录</div>';
      return;
    }
    elHistoryList.innerHTML = list.map(function (item, i) {
      return '<div class="json-hist-entry">' +
        '<div class="json-hist-meta">' +
          formatAgo(item.time) +
          '<button class="btn-copy json-hist-copy" data-idx="' + i + '">复制</button>' +
        '</div>' +
        '<div class="json-output-section">' +
        '<pre class="json-output-pre">' + syntaxHighlight(item.prettified) + '</pre>' +
        '</div>' +
        '</div>';
    }).join('');

    elHistoryList.querySelectorAll('.json-hist-copy').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var item = loadHistory()[parseInt(btn.dataset.idx, 10)];
        if (!item) return;
        navigator.clipboard.writeText(item.prettified).then(function () {
          btn.textContent = '已复制!';
          setTimeout(function () { btn.textContent = '复制'; }, 1500);
        });
      });
    });
  }

  // ── Panel switching ───────────────────────────────────────────
  function showParsePanel() {
    elParsePanel.classList.remove('hidden');
    elHistoryPanel.classList.add('hidden');
    elHistoryBtn.classList.remove('active');
  }

  function showHistoryPanel() {
    elParsePanel.classList.add('hidden');
    elHistoryPanel.classList.remove('hidden');
    elHistoryBtn.classList.add('active');
    renderHistory();
  }

  elHistoryBtn.addEventListener('click', function () {
    if (elHistoryPanel.classList.contains('hidden')) {
      showHistoryPanel();
    } else {
      showParsePanel();
    }
  });

  // clicking any action button returns to parse panel
  [elPrettify, elMinify, elUnescape].forEach(function (btn) {
    btn.addEventListener('click', function () { showParsePanel(); }, true);
  });

  // ── Prettify ──────────────────────────────────────────────────
  function doPrettify(raw) {
    raw = (raw !== undefined) ? raw : elInput.value;
    clearError();
    try {
      var result = JSON.stringify(JSON.parse(raw), null, 2);
      setOutput(result);
      saveToHistory(raw, result);
    } catch (e) {
      clearOutput();
      elError.textContent = getErrorHint(e, raw);
    }
  }

  // ── Buttons ───────────────────────────────────────────────────
  elPrettify.addEventListener('click', function () { doPrettify(); });

  elMinify.addEventListener('click', function () {
    clearError();
    var raw = elInput.value;
    try {
      var result = JSON.stringify(JSON.parse(raw));
      setOutput(result);
      saveToHistory(raw, result);
    } catch (e) {
      clearOutput();
      elError.textContent = getErrorHint(e, raw);
    }
  });

  elUnescape.addEventListener('click', function () {
    clearError();
    var raw = elInput.value;
    try {
      var parsed = JSON.parse(raw);
      if (typeof parsed === 'string') {
        try {
          var result = JSON.stringify(JSON.parse(parsed), null, 2);
          setOutput(result);
          saveToHistory(raw, result);
        } catch (_) {
          setOutput(parsed);
          saveToHistory(raw, parsed);
        }
        return;
      }
    } catch (_) { /* fall through */ }
    var unescaped = raw
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');
    setOutput(unescaped);
    saveToHistory(raw, unescaped);
  });

  // ── Auto-prettify on paste ────────────────────────────────────
  elInput.addEventListener('paste', function () {
    setTimeout(function () { doPrettify(); }, 0);
  });

  elInput.addEventListener('input', clearError);

  // ── Copy ─────────────────────────────────────────────────────
  elCopy.addEventListener('click', function () {
    if (!_lastText) return;
    navigator.clipboard.writeText(_lastText).then(function () {
      elCopy.textContent = '已复制!';
      setTimeout(function () { elCopy.textContent = '复制'; }, 1500);
    });
  });
})();
