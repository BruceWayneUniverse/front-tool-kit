(function () {
  var elInput      = document.getElementById('json-input');
  var elOutput     = document.getElementById('json-output');
  var elError      = document.getElementById('json-error');
  var elPrettify   = document.getElementById('json-prettify-btn');
  var elMinify     = document.getElementById('json-minify-btn');
  var elUnescape   = document.getElementById('json-unescape-btn');
  var elCopy       = document.getElementById('json-copy-btn');

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

  // Walk the raw string up to `pos`, collect all object keys in order,
  // and return the last few as a field path hint.
  function fieldPathBefore(raw, pos) {
    var chunk = raw.slice(0, pos + 1);
    var keys = [];
    var re = /"((?:[^"\\]|\\.)*)"\s*:/g;
    var m;
    while ((m = re.exec(chunk)) !== null) {
      keys.push(m[1]);
    }
    if (keys.length === 0) return null;
    // Show last 3 keys as breadcrumb
    var trail = keys.slice(-3);
    var total = keys.length;
    return '第 ' + total + ' 个字段 "' + trail.join('" > "') + '" 附近';
  }

  function getErrorPos(e, raw) {
    var msg = e.message || String(e);

    // Chrome: "... at JSON position 42" or "... at position 42"
    var posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) return parseInt(posMatch[1], 10);

    // Firefox: "at line X column Y of the JSON"
    var ffMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (ffMatch) {
      var line = parseInt(ffMatch[1], 10);
      var col  = parseInt(ffMatch[2], 10);
      var lines = raw.split('\n');
      var pos = 0;
      for (var i = 0; i < line - 1 && i < lines.length; i++) {
        pos += lines[i].length + 1; // +1 for \n
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

  // ── Prettify ──────────────────────────────────────────────────
  function doPrettify(raw) {
    raw = (raw !== undefined) ? raw : elInput.value;
    clearError();
    try {
      setOutput(JSON.stringify(JSON.parse(raw), null, 2));
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
      setOutput(JSON.stringify(JSON.parse(raw)));
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
        // Try to further prettify if it looks like JSON
        try {
          setOutput(JSON.stringify(JSON.parse(parsed), null, 2));
        } catch (_) {
          setOutput(parsed);
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
