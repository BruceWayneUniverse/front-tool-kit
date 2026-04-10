(function () {
  const input = document.getElementById('calc-input');
  const evalBtn = document.getElementById('calc-eval-btn');
  const errorDiv = document.getElementById('calc-error');
  const resultDiv = document.getElementById('calc-result');
  const historyDiv = document.getElementById('calc-history');

  const history = [];

  function renderHistory() {
    if (history.length === 0) {
      historyDiv.innerHTML = '<div class="history-empty">暂无历史记录</div>';
      return;
    }
    historyDiv.innerHTML = history
      .map(
        (entry, index) =>
          `<div class="history-item" data-index="${index}">${entry.expression} = ${entry.result}</div>`
      )
      .join('');

    historyDiv.querySelectorAll('.history-item').forEach(function (item) {
      item.addEventListener('click', function () {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        input.value = history[idx].expression;
        input.focus();
      });
    });
  }

  // Convert number to plain string, never scientific notation
  function toPlainString(val) {
    if (typeof val !== 'number' || !isFinite(val)) return String(val);
    var str = val.toString();
    if (str.indexOf('e') === -1 && str.indexOf('E') === -1) return str;

    var parts = str.toLowerCase().split('e');
    var exp = parseInt(parts[1], 10);
    var baseParts = parts[0].split('.');
    var intDigits = baseParts[0].replace('-', '');
    var fracDigits = baseParts[1] || '';
    var isNeg = val < 0;
    var digits = intDigits + fracDigits;
    var dotPos = intDigits.length + exp;

    var result;
    if (dotPos >= digits.length) {
      result = digits + '0'.repeat(dotPos - digits.length);
    } else if (dotPos <= 0) {
      result = '0.' + '0'.repeat(-dotPos) + digits;
    } else {
      result = digits.slice(0, dotPos) + '.' + digits.slice(dotPos);
    }
    return (isNeg ? '-' : '') + result;
  }

  function evaluate() {
    const expression = input.value.trim();
    if (!expression) return;

    try {
      const result = math.evaluate(expression);
      const resultStr = toPlainString(typeof result === 'number' ? result : result.valueOf ? result.valueOf() : result);
      resultDiv.textContent = resultStr;
      resultDiv.classList.remove('hidden');
      errorDiv.textContent = '';

      history.unshift({ expression: expression, result: resultStr });
      if (history.length > 10) {
        history.length = 10;
      }
      renderHistory();
    } catch (e) {
      errorDiv.textContent = 'Invalid expression';
      resultDiv.classList.add('hidden');
    }
  }

  evalBtn.addEventListener('click', evaluate);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      evaluate();
    }
  });

  input.addEventListener('input', function () {
    errorDiv.textContent = '';
  });

  renderHistory();
})();
