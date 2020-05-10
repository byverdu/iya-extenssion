class TabEnvManager {
  static badgeOff = {
    color: '#ff0037',
    text: 'OFF',
    path: './assets/icon128.png',
  }
  static badgeOn = {
    color: '#15b169',
    text: 'ON',
    path: './assets/icon-on.png',
  }
  constructor() {
    this._extensionStorage = extensionStorage
    this._extensionTabs = extensionTabs
    this._extensionMessenger = extensionMessenger
    this._setBadgeContent = this.setBadgeContent.bind(this);
    this._onBrowserActionClicked = this.onBrowserActionClicked.bind(this);
    this._onDisabled = this.onDisabled.bind(this);
    this._onEnabled = this.onEnabled.bind(this);
  }

  /**
 * @param {{text: string, color: string, path: string}} Obj
 */
  setBadgeContent({ text, color, path }) {
    chrome.browserAction.setBadgeText({ text })
    chrome.browserAction.setBadgeBackgroundColor({ color })
    chrome.browserAction.setIcon({ path })
  }

  async onDisabled() {
    const { text, color, path } = TabEnvManager.badgeOn
    this._setBadgeContent({
      text,
      color,
      path,
    })

    this._extensionStorage.set('enabled', true)

    try {
      const tabIds = await this._extensionTabs.getIdsForDomain('inyourarea')

      tabIds.forEach(id => {
        this._extensionMessenger.send(
          chrome.tabs,
          id,
          { action: 'enable' },
          links => {
            this._extensionStorage.set('links', links)
            this._extensionStorage.set('tabIds', tabIds)
          }
        )
      })
    } catch (error) {
      console.error(error)
    }
  }

  async onEnabled() {
    const { text, color, path } = TabEnvManager.badgeOff

    this._setBadgeContent({
      text,
      color,
      path,
    })

    this._extensionStorage.set('enabled', false);

    try {
      const { links, tabIds } = await this._extensionStorage.get(['links', 'tabIds'])

      tabIds.forEach(id => {
        this._extensionMessenger.send(
          chrome.tabs,
          id,
          { action: 'disable', links }
        )
      });

      this._extensionStorage.remove(['links', 'tabIds'])

    } catch (error) {
      console.error(error)
    }
  }

  async onBrowserActionClicked() {
    try {
      const enabled = await this._extensionStorage.get('enabled')

      if (!enabled) {
        this.onDisabled()
      }
      if (enabled) {
        this.onEnabled()
      }
    } catch (error) {
      console.error(error)
    }
  }

  init() {
    chrome.runtime.onInstalled.addListener(() => {
      const { text, color, path } = TabEnvManager.badgeOff

      this._setBadgeContent({
        text,
        color,
        path,
      });
      chrome.storage.local.set({ enabled: false })
    });

    chrome.browserAction.onClicked.addListener(this._onBrowserActionClicked)
  }
}


window.tabEnvManager = new TabEnvManager();
window.tabEnvManager.init()