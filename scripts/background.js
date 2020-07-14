const {
  EXTENSION_ENABLED,
  EXTENSION_DISABLED,
  OPTIONS_SAVED,
  DELETE_ALL,
  DELETE_BY_ID,
} = ACTIONS

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
    this._setBadgeContent = this.setBadgeContent
    this._onBrowserActionClicked = this.onBrowserActionClicked.bind(this)
    this._toEnableMsgCallback = this.toEnableMsgCallback.bind(this)
    this._toEnable = this.toEnable.bind(this)
    this._toDisable = this.toDisable.bind(this)
    this._runtimeMsgHandler = this.runtimeMsgHandler.bind(this)

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
  async toEnableMsgCallback(newLinks, newTabIds) {
    if (chrome.runtime.lastError) {
      tabEnvLogger.log(
        'warn',
        `toEnable => ${chrome.runtime.lastError.message}`
      )
    }

    this.allTabsIds.push(...newTabIds)
    this.allLinks = {
      ...this.allLinks,
      ...newLinks,
    }

    this._extensionStorage.set('links', this.allLinks)
    this._extensionStorage.set('tabIds', this.allTabsIds)
  }

  async toEnable() {
    try {
      const apps = await this._extensionStorage.get('apps')

      if (apps.length > 0) {
        const { text, color, path } = TabEnvManager.badgeOn
        this._setBadgeContent({
          text,
          color,
          path,
        })

        this._extensionStorage.set('enabled', true)

        apps.forEach((input) => {
          const { prod, stag, localhost, icon, name } = input
          const selectedEnvs = envOptionsValidator({ prod, stag, localhost })

          selectedEnvs.forEach(async ({ env, host }) => {
            try {
              const tabIds = await this._extensionTabs.getIdsForDomain(host)

              tabIds.forEach((id) => {
                chrome.tabs.sendMessage(
                  id,
                  setAction(EXTENSION_ENABLED, { env, icon, name }),
                  (links) => {
                    console.log({ [id]: links })
                    this._toEnableMsgCallback({ [id]: links }, tabIds)
                  }
                )
              })
            } catch (error) {
              tabEnvLogger.log('error', error)
            }
          })
        })
      }
    } catch (error) {
      alert('You must set some options')
    }
  }

  async toDisable() {
    const { text, color, path } = TabEnvManager.badgeOff

    this._setBadgeContent({
      text,
      color,
      path,
    })

    this._extensionStorage.set('enabled', false)

    try {
      const { links, tabIds } = await this._extensionStorage.get([
        'links',
        'tabIds',
      ])

      tabIds.forEach((id) => {
        chrome.tabs.sendMessage(
          id,
          setAction(EXTENSION_DISABLED, { links: links[id] })
        )
      })

      this._extensionStorage.remove(['tabIds', 'links'], () => {
        this.allLinks = {}
        this.allTabsIds = []
      })
    } catch (error) {
      tabEnvLogger.log('error', error)
    }
  }

  async onBrowserActionClicked() {
    try {
      const enabled = await this._extensionStorage.get('enabled')

      enabled ? this.toDisable() : this.toEnable()
    } catch (error) {
      tabEnvLogger.log('error', error)
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
      this._extensionStorage.get('apps').then((resp) => {
        const savedApps = (resp || []).slice()
        const newApps = msg.apps.map((app) => {
          const savedAppIndex = savedApps.findIndex((x) => x.id === app.id)
          if (savedAppIndex !== -1) {
            savedApps.splice(savedAppIndex, 1)
          }
          return app
        })
        this._extensionStorage.set('apps', [...savedApps, ...newApps], () => {
          sendResponse({ [msg.action]: true })
        })
      })

      return true
    }

    if (msg && msg.action && msg.action === DELETE_BY_ID) {
      const { appId } = msg
      this._extensionStorage.get('apps').then((resp) => {
        const savedApps = (resp || []).slice()
        const newApps = savedApps.filter((app) => app.id !== appId)
        this._extensionStorage.set('apps', newApps, () => {
          sendResponse({ [msg.action]: true })
        })
      })

      return true
    }

    if (msg && msg.action && msg.action === DELETE_ALL) {
      this._extensionStorage.clear((_) => {
        sendResponse({ [msg.action]: true })
      })
      return true
    }
  }

  init() {
    tabEnvLogger.log('info', 'init extension')
    chrome.runtime.onInstalled.addListener(() => {
      const { text, color, path } = TabEnvManager.badgeOff

      this._setBadgeContent({
        text,
        color,
        path,
      })
      chrome.storage.local.get('apps', ({ apps = [] }) => {
        chrome.storage.local.set({ enabled: false, apps })
      })
    })

    chrome.browserAction.onClicked.addListener(this._onBrowserActionClicked)
    chrome.runtime.onMessage.addListener(this._runtimeMsgHandler)
  }
}

window.tabEnvManager = new TabEnvManager()
window.tabEnvManager.init()
