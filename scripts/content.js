const { EXTENSION_ENABLED, EXTENSION_DISABLED } = ACTIONS

function onEnabled({ env, icon, name }, sendResponse) {
  if (chrome.runtime.lastError) {
    tabEnvLogger.log('warn', `onEnabled => ${chrome.runtime.lastError.message}`)
  }
  const links = Array.from(document.querySelectorAll('link[rel*=icon]')).map(
    (item) => item.outerHTML
  )
  const title = document.title

  document.querySelectorAll('link[rel*=icon]').forEach((item) => item.remove())

  const head = document.querySelector('head')
  const link = document.createElement('link')
  document.title = `${env} - ${name}`.toUpperCase()
  link.rel = 'icon'
  link.href = svgToDataUri({ env, icon })
  link.className = 'icon-rel'
  head.appendChild(link)

  sendResponse({ links, title })

  return true
}

function onDisabled({ links = [], title = '' }) {
  if (chrome.runtime.lastError) {
    tabEnvLogger.log(
      'warn',
      `onDisabled => ${chrome.runtime.lastError.message}`
    )
  }
  document.querySelector('.icon-rel').remove()
  const head = document.querySelector('head')
  document.title = title

  links.forEach((item) => {
    head.insertAdjacentHTML('beforeend', item)
  })

  return true
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (chrome.runtime.lastError) {
    tabEnvLogger.log('warn', `onMessage => ${chrome.runtime.lastError.message}`)
  }
  if (msg && msg.action && msg.action === EXTENSION_ENABLED) {
    onEnabled(msg, sendResponse)
  }
  if (msg && msg.action && msg.action === EXTENSION_DISABLED) {
    onDisabled(msg.links)
  }
})
