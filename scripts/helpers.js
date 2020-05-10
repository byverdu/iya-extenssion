const extensionStorage = {
  /**
   * 
   * @param {string | string[] | Object | null} prop
   * @returns {Promise}
   */
  get(prop) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(prop, (storage) => {
        if (typeof storage !== 'undefined') {
          console.log('helpers', storage)
          if (typeof prop === 'string') resolve(storage[prop])
          if (typeof prop === 'object') resolve(storage)
        } else {
          reject('Enabled is not defined')
        }
      })
    })
  },

  /**
   * 
   * @param {string} prop 
   * @param {any} value 
   */
  set(prop, value) {
    chrome.storage.local.set({ [prop]: value })
  },

  /**
   * 
   * @param {string | string[]} keys 
   */
  remove(keys) {
    chrome.storage.local.remove(keys)
  }
}

const extensionTabs = {
  /**
   * @param {string} domain
   * @returns {Promise<Array<number>>}
   */
  getIdsForDomain(domain) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({}, tabs => {
        const domainTabs = tabs.filter(tab => tab.url.includes(domain)).map(tab => tab.id)

        if (domainTabs.length > 0) {
          resolve(domainTabs)
        } else {
          reject(`No open tabs for ${domain}`)
        }
      })
    })
  }
}

const extensionMessenger = {
  /**
   * 
   * @param {chrome.tabs} sender
   * @param {number} id
   * @param {any} msg
   * @param {(response) => void} [responseCallback] Optional.
   */
  send(sender, id, msg, responseCallback) {
    sender.sendMessage(id, msg, responseCallback)
  }
}
