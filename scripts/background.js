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
    this._tabUpdateHandler = this.tabUpdateHandler.bind(this)
    this.init = this.init.bind(this)

    this.allLinks = {}
    this.allTabsIds = []
    this.allAppsUrls = []
    this.enabled = false
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
   * @typedef {Object} Links
   * @property {string} links - new favicon
   * @property {string} title - Document Title

   * @param {Links} links
   * @param {number} id
   */
  // async toEnableMsgCallback(newLinks, newTabIds) {
  async toEnableMsgCallback(links, id) {
    if (chrome.runtime.lastError) {
      tabEnvLogger.log(
        'warn',
        `toEnable => ${chrome.runtime.lastError.message}`
      )

      return true
    }

    this.allTabsIds.push(id)
    this.allLinks = {
      ...this.allLinks,
      ...{ [id]: links.links },
    }

    this._extensionStorage.set('links', {
      links: this.allLinks,
      title: links.title,
    })
    this._extensionStorage.set('tabIds', [...new Set(this.allTabsIds)])
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
        this.enabled = true

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
                    console.log({ [id]: links.links })
                    this._toEnableMsgCallback(links, id)
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
        const linksForId = links.links[id]
        chrome.tabs.sendMessage(
          id,
          setAction(EXTENSION_DISABLED, {
            links: {
              links: linksForId,
              title: links.title,
            },
          })
        )
      })

      this._extensionStorage.remove(['tabIds', 'links'], () => {
        this.allLinks = {}
        this.allTabsIds = []
        this.enabled = false
      })
    } catch (error) {
      tabEnvLogger.log('error', error)
    }
  }

  /**
   * @param {chrome.tabs.Tab} [tab] Optional
   */
  async onBrowserActionClicked(tab) {
    console.log(tab)
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
        const apps = [...savedApps, ...newApps]
        const appsUrls = apps
          .reduce(
            (prev, curr) => [
              ...prev,
              `${curr.id}|prod|${curr.prod}`,
              `${curr.id}|stag|${curr.stag}`,
              `${curr.id}|localhost|${curr.localhost}`,
            ],
            []
          )
          .filter(Boolean)

        this._extensionStorage.set('apps', apps, () => {
          sendResponse({ [msg.action]: true })
          this.allAppsUrls = appsUrls
          this._extensionStorage.set('appsUrls', appsUrls)
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

  /**
   *
   * @param {number} tabId
   * @param {chrome.tabs.TabChangeInfo} changeInfo
   * @param {chrome.tabs.Tab} tab
   */
  tabUpdateHandler(tabId, changeInfo, tab) {
    try {
      const url = tab.url && new URL(tab.url)
      const savedApp = this.allAppsUrls.find((item) =>
        item.includes(url.origin)
      )

      if (this.enabled && savedApp) {
        const [id, env] = savedApp.split('|')
        console.log(tab)
        this._extensionStorage.get('apps').then((apps) => {
          const { icon, name } = apps.find((app) => app.id === id)
          chrome.tabs.sendMessage(
            tabId,
            setAction(EXTENSION_ENABLED, { env, icon, name }),
            (links) => {
              if (links.links.length > 1) {
                this._toEnableMsgCallback(links, tabId)
              }
            }
          )
        })
      }
    } catch (e) {
      return
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
      chrome.storage.local.get(
        ['apps', 'appsUrls'],
        ({ apps = [], appsUrls = [] }) => {
          chrome.storage.local.set({ enabled: false, apps, appsUrls })
          this.allAppsUrls = appsUrls
        }
      )
    })

    chrome.browserAction.onClicked.addListener(this._onBrowserActionClicked)
    chrome.runtime.onMessage.addListener(this._runtimeMsgHandler)
    chrome.tabs.onUpdated.addListener(this._tabUpdateHandler)
  }
}

window.tabEnvManager = new TabEnvManager()
window.tabEnvManager.init()
