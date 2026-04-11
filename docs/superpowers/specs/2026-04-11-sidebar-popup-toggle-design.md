# Design: Sidebar ↔ Popup Mode Toggle

**Date:** 2026-04-11  
**Project:** front-tool-kit (Chrome Extension MV3)

## Overview

Add the ability for users to freely switch the extension's display mode between Chrome's Side Panel (sidebar) and a native action popup. The selected mode persists across browser sessions.

## User Interaction

- **Trigger:** Right-click the extension icon → context menu
- **Menu item text:** Dynamic, always shows the action:
  - When in sidebar mode → "切换到弹窗模式"
  - When in popup mode → "切换到侧边栏模式"
- **On switch:** Immediately opens the new mode's UI without requiring an extra click

## Architecture

### Data persistence

`chrome.storage.local` stores the current mode:

```json
{ "mode": "sidePanel" | "popup" }
```

Default (first install): `"sidePanel"` — preserves existing behavior.

### background.js changes

1. On `chrome.runtime.onInstalled`: initialize storage with `{ mode: 'sidePanel' }` if not set, register context menu item.
2. On context menu click:
   - Read current mode from storage
   - Toggle to the other mode and write back to storage
   - Apply Chrome API changes:
     - **→ sidePanel:** `chrome.action.setPopup({popup: ''})`, `chrome.sidePanel.setOptions({enabled: true})`, `chrome.sidePanel.open({windowId})`
     - **→ popup:** `chrome.sidePanel.setOptions({enabled: false})`, `chrome.action.setPopup({popup: 'popup.html'})`, `chrome.action.openPopup()`
   - Update context menu item title to reflect new state

### popup.js (new file)

Loaded by `popup.html`. On `DOMContentLoaded`:

1. Read the currently active tool tab (timestamp / JSON / calculator) by checking which `.tab-btn` has the `active` class in the DOM
2. Set `document.body` dimensions based on active tool tab (see sizing table below)
3. Listen for tool tab-switch clicks → re-apply dimensions

This file only affects popup mode behavior; sidebar mode is unaffected.

## Popup Mode Sizing

| Tool Tab | Width  | Height |
|----------|--------|--------|
| 时间戳    | 360px  | 400px  |
| JSON      | 800px  | 600px  |
| 计算器    | 400px  | 460px  |

Sizes are applied via `document.body.style.width/height`. Chrome's popup resizes to match content dimensions automatically.

## manifest.json changes

Add `"contextMenus"` to the `permissions` array.

## Files Changed

| File | Change |
|------|--------|
| `manifest.json` | Add `contextMenus` permission |
| `background.js` | Add mode toggle logic, context menu registration |
| `popup.html` | Add `<script src="js/popup.js"></script>` |
| `js/popup.js` | New file: dynamic popup sizing |

## Constraints & Notes

- `chrome.action.openPopup()` requires Chrome 127+ and a user gesture context. The context menu `onClicked` handler qualifies.
- `chrome.sidePanel.open()` requires the `sidePanel` permission (already present in manifest).
- Sidebar mode sizing is unchanged from current behavior.
