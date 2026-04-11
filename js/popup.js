(function () {
  var SIZES = {
    timestamp:  { width: 480, height: 400 },
    json:       { width: 600, height: 600 },
    calculator: { width: 480, height: 460 },
  };

  function applySize(tabName) {
    var size = SIZES[tabName] || SIZES.timestamp;
    document.body.style.width     = size.width  + 'px';
    document.body.style.minWidth  = size.width  + 'px';
    document.body.style.height    = size.height + 'px';
    document.body.style.minHeight = size.height + 'px';
  }

  var toggleBtn = document.getElementById('mode-toggle-btn');

  chrome.storage.local.get('mode', function (data) {
    var mode = data.mode || 'sidePanel';
    toggleBtn.textContent = mode === 'sidePanel' ? '⊡ 弹窗' : '▣ 侧边栏';

    if (mode === 'popup') {
      var activeBtn = document.querySelector('.tab-btn.active');
      applySize(activeBtn ? activeBtn.dataset.tab : 'timestamp');
      document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { applySize(btn.dataset.tab); });
      });
    }
  });

  // Handle toggle directly in this page so the user-gesture context is preserved.
  // Calling sidePanel.open() / action.openPopup() through a sendMessage handler
  // loses the gesture flag and Chrome throws an error.
  toggleBtn.addEventListener('click', function () {
    chrome.storage.local.get('mode', function (data) {
      var currentMode = data.mode || 'sidePanel';
      var newMode = currentMode === 'sidePanel' ? 'popup' : 'sidePanel';

      chrome.storage.local.set({ mode: newMode });

      if (newMode === 'sidePanel') {
        // Currently in popup → switch to side panel
        // Enable side panel first (callback keeps us in gesture context), then open
        chrome.sidePanel.setOptions({ enabled: true }, function () {
          chrome.action.setPopup({ popup: '' });
          chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
          chrome.windows.getCurrent(function (win) {
            chrome.sidePanel.open({ windowId: win.id });
            window.close();
          });
        });
      } else {
        // Currently in side panel → switch to popup
        // Set the popup path first (callback keeps us in gesture context), then open
        chrome.action.setPopup({ popup: 'popup.html' }, function () {
          chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
          chrome.sidePanel.setOptions({ enabled: false });
          chrome.windows.getCurrent(function (win) {
            chrome.action.openPopup({ windowId: win.id });
            window.close();
          });
        });
      }
    });
  });
})();
