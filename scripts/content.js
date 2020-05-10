function onEnabled(sendResponse) {
  const links = Array.from(document.querySelectorAll('link[rel*=icon]')).map(item => item.outerHTML)

  document.querySelectorAll('link[rel*=icon]').forEach(item => item.remove())

  const head = document.querySelector('head')
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = buildCanvasIcon();
  link.className = 'icon-rel'
  head.appendChild(link)

  sendResponse(links)
}

function onDisabled(links) {
  document.querySelector('.icon-rel').remove()
  const head = document.querySelector('head')

  links.forEach(item => {
    head.insertAdjacentHTML('beforeend', item)
  })
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg && msg.action && msg.action === 'enable') onEnabled(sendResponse)
  if (msg && msg.action && msg.action === 'disable') onDisabled(msg.links)

  return true
})