const STORAGE_KEY = 'mode';
const MODE_SIDE_PANEL = 'sidePanel';
const MODE_POPUP = 'popup';

// Apply mode settings — used for init and startup (no open/close)
async function applyMode(mode) {
  if (mode === MODE_SIDE_PANEL) {
    await chrome.action.setPopup({ popup: '' });
    await chrome.sidePanel.setOptions({ enabled: true });
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } else {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    await chrome.sidePanel.setOptions({ enabled: false });
    await chrome.action.setPopup({ popup: 'popup.html' });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  if (!data[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: MODE_SIDE_PANEL });
  }
  await applyMode(data[STORAGE_KEY] || MODE_SIDE_PANEL);
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  await applyMode(data[STORAGE_KEY] || MODE_SIDE_PANEL);
});
