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
    this._setBadgeContent = this.setBadgeContent.bind(this);
    this._onBrowserActionClicked = this.onBrowserActionClicked.bind(this);
    this._onDisabledMsgCallback = this.onDisabledMsgCallback.bind(this);
    this._onDisabled = this.onDisabled.bind(this);
    this._onEnabled = this.onEnabled.bind(this);
    this._runtimeMsgHandler = this.runtimeMsgHandler.bind(this);

    this.allLinks = {}
    this.allTabsIds = []
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
   * @param {string[]} newLinks 
   * @param {number[]} newTabIds 
   */
  async onDisabledMsgCallback(newLinks, newTabIds) {
    if (chrome.runtime.lastError) {
      console.log('onDisabled in bg script', chrome.runtime.lastError.message)
    }

    this.allTabsIds.push(...newTabIds)
    this.allLinks = {
      ...this.allLinks,
      ...newLinks
    }

    this._extensionStorage.set('links', this.allLinks)
    this._extensionStorage.set('tabIds', this.allTabsIds)
  }

  async onDisabled() {
    try {
      const inputs = await this._extensionStorage.get('inputs')
      const {prod, stag, localhost, icon, name} = inputs
      const envs = envOptionsValidator({prod, stag, localhost })

      const { text, color, path } = TabEnvManager.badgeOn
      this._setBadgeContent({
        text,
        color,
        path,
      })
  
      this._extensionStorage.set('enabled', true)

      envs.forEach(async ({env, value}) => {
        try {
          const tabIds = await this._extensionTabs.getIdsForDomain(value)
    
          tabIds.forEach(id => {
            chrome.tabs.sendMessage(
              id,
              setAction(EXTENSION_ENABLED, { env, icon, name }),
              links => {
                console.log({[id]: links})
                this._onDisabledMsgCallback({[id]: links}, tabIds)
              }
            )
          })
        } catch (error) {
          console.error(error)
        }
      })

    } catch (error) {
      alert(error)
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
      const {links, tabIds} = await this._extensionStorage.get(['links', 'tabIds'])

      tabIds.forEach(id => {
        chrome.tabs.sendMessage(  
          id,
          setAction(EXTENSION_DISABLED, { links: links[id] }),
        )
      });

      this._extensionStorage.remove(['tabIds', 'links'], () => {
        this.allLinks = {}
        this.allTabsIds = []
      })

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

  /**
   * 
   * @param {any} msg 
   * @param {chrome.runtime.MessageSender} sender 
   * @param {(resp) => void} sendResponse 
   */
  runtimeMsgHandler(msg, sender, sendResponse) {
    if (msg && msg.action && msg.action === OPTIONS_SAVED) {
      console.log(msg)
      this._extensionStorage.set('inputs', {...msg.inputs});
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

    chrome.runtime.onMessage.addListener(this._runtimeMsgHandler)
  }
}


window.tabEnvManager = new TabEnvManager();
window.tabEnvManager.init()

chrome.tabs.onUpdated.addListener(() => {
  console.log('yeah!!!!')
})
