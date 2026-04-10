function applyTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.add('hidden'); });
  document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
  document.getElementById('tab-' + tab).classList.remove('hidden');
}

document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { applyTab(btn.dataset.tab); });
});