const config = {
  colors: {
    on: '#15b169',
    off: '#ff0037',
  },
  text: {
    on: 'ON',
    off: 'OFF',
  },
  path: {
    on: './assets/icon-on.png',
    off: './assets/icon128.png',
  }
}

/**
 * @param {{text: string, color: string, path: string}} Obj
 */
function setBadgeContent({ text, color, path }) {
  chrome.browserAction.setBadgeText({ text })
  chrome.browserAction.setBadgeBackgroundColor({ color })
  chrome.browserAction.setIcon({ path })
}
