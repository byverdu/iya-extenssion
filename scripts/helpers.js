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

function buildCanvasIcon() {
  const thumb = "M 263.9 190.1 C 263.9 182.1 257.4 175.6 249.4 175.6 C 249.4 175.6 248.3 175.6 246.6 175.6 C 238.6 175.6 216 175 216.1 168.7 C 216.1 166.8 216.2 164.7 216.4 162.4 C 216.7 159.7 217.2 157 217.4 154.7 C 218.8 138.1 213 129 208 129 C 206.8 129 197.7 129.6 198.3 134.5 C 198.5 136.8 199.5 148.4 196.5 158.3 C 191.7 167.1 177 183.2 168.1 190.5 C 167.9 189.8 167.6 189 167.4 188.3 C 166.8 186.2 166.2 184.1 165.6 182 C 163.4 182.6 161.3 183.2 159.2 183.9 C 150.8 186.3 142.5 188.8 134.1 191.3 C 132 191.9 129.9 192.5 127.8 193.1 C 128.4 195.3 129 197.4 129.6 199.5 C 135.8 220.4 141.9 241.3 148.1 262.3 C 148.7 264.4 149.4 266.5 150 268.6 C 152.1 268 154.2 267.4 156.4 266.8 C 164.7 264.3 173.1 261.8 181.4 259.4 C 183.6 258.7 185.7 258.1 187.8 257.5 C 187.2 255.4 186.6 253.2 185.9 251.1 C 184.5 246.3 183.1 241.5 181.7 236.7 C 184 236.1 187.7 235.6 193.3 235.6 C 196 235.6 199.1 235.7 202.6 236 C 213.2 237 223.2 237.7 228.8 238.4 C 230.1 238.6 231.6 238.7 233.1 238.7 C 238.1 238.7 243.6 237.5 245.1 233.3 C 245.6 232.1 245.8 231 246 229.9 C 250.5 228.2 254 224.1 254.2 219 C 254.3 218 254.2 217.1 254.1 216.2 C 257.5 214.2 259.9 210.6 260.1 206.4 C 260.2 204.4 259.8 202.5 259.1 200.8 C 262 198.1 263.9 194.4 263.9 190.1M 154.5 260.4 C 148.3 239.5 142.2 218.5 136 197.6 C 144.4 195.2 152.7 192.7 161.1 190.2 C 167.2 211.1 173.4 232.1 179.6 253 C 171.2 255.4 162.8 257.9 154.5 260.4z"
  const path = new Path2D(thumb);
  /**
   *  @type {HTMLCanvasElement}
  */
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.beginPath();
  ctx.fillStyle = 'hsla(348, 83%, 50%, 1)';
  ctx.fill(path);
  ctx.restore();

  return canvas.toDataURL('image/png')
}