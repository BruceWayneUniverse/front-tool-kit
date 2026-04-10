var TAB_WIDTH = {
  timestamp:  '480px',
  json:       '860px',
  calculator: '600px',
};

function applyTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.add('hidden'); });
  document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
  document.getElementById('tab-' + tab).classList.remove('hidden');

  document.body.style.width  = TAB_WIDTH[tab] || '480px';
  document.body.style.height = tab === 'json' ? '9999px' : 'auto';
}

document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { applyTab(btn.dataset.tab); });
});
