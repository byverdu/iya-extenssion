document.addEventListener('DOMContentLoaded', (e) => {

  document.querySelector('.js-save-options')
    .addEventListener('click', (e) => {
      e.preventDefault();

      const inputs = [...document.querySelectorAll('input')]
        .filter(input => input.value.length > 0)
        .reduce((acc, prev) => {
          return {
            ...acc,
            [prev.name]: prev.value
          }
        }, {})

      chrome.runtime.sendMessage(setAction(OPTIONS_SAVED, {inputs}))
    })
})
