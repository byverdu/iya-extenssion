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
    this._setBadgeContent = this.setBadgeContent.bind(this)
    this._getLocalStorage = this.getLocalStorage.bind(this);
    this._setLocalStorage = this.setLocalStorage.bind(this);
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

  /**
   * 
   * @param {string} prop 
   */
  getLocalStorage(prop) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([prop], (storage) => {
        if (typeof storage[prop] !== 'undefined') {
          resolve(storage[prop])
        } else {
          reject('Enabled is not defined')
        }
      })
    })
  }

  /**
   * 
   * @param {string} prop 
   * @param {any} value 
   */
  setLocalStorage(prop, value) {
    chrome.storage.local.set({ [prop]: value })
  }

  onDisabled() {
    const { text, color, path } = TabEnvManager.badgeOn
    this._setBadgeContent({
      text,
      color,
      path,
    })

    this._setLocalStorage('enabled', true)
  }

  onEnabled() {
    const { text, color, path } = TabEnvManager.badgeOff

    this._setBadgeContent({
      text,
      color,
      path,
    })

    this._setLocalStorage('enabled', false)
  }

  async onBrowserActionClicked() {
    try {
      const enabled = await this._getLocalStorage('enabled')

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