const { colors, text, path } = config;

chrome.runtime.onInstalled.addListener(() => {
  setBadgeContent({
    text: text.off,
    color: colors.off,
    path: path.off
  });
})

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.storage.local.get(['enabled'], ({ enabled }) => {
    if (!enabled) {
      setBadgeContent({
        text: text.on,
        color: colors.on,
        path: path.on
      })
      chrome.storage.local.set({ enabled: true })
    } else {
      setBadgeContent({
        text: text.off,
        color: colors.off,
        path: path.off
      })
      chrome.storage.local.set({ enabled: false })
    }
  })
});
