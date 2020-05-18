document.addEventListener('DOMContentLoaded', (e) => {
  document.querySelector('.js-save-options')
    .addEventListener('click', (e) => {
      e.preventDefault();

      const inputs = [...document.querySelectorAll('.app-row')]
        .map(item => [...item.children])
        .map(item => item
            .map(item => item.querySelector('input'))
            .filter(item => item && item.value.length > 0)
            .reduce((acc, prev) => ({
              ...acc,
              [prev.name]: prev.value
            }), {})
        )

      chrome.runtime.sendMessage(setAction(OPTIONS_SAVED, {inputs}))
    })
})
