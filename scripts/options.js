const { OPTIONS_SAVED, DELETE_ALL } = ACTIONS

/**
 * @param {number} rowIndex
 */
const emptyRow = (
  rowIndex,
  savedOptions = undefined
) => `<tr id="row-${rowIndex}" class="js-app-row">
  <td>
  </td>
  <td>
    <div class="mui-textfield">
      <input value="${
        savedOptions?.name ? savedOptions.name : ''
      }" class="js-to-validate" required name="name" id="app-name" type="text">
    </div>
  </td>
  <td>
    <div class="mui-textfield">
      <input value="${
        savedOptions?.prod ? savedOptions.prod : ''
      }" name="prod" id="app-prod" type="text">
    </div>
  </td>
  <td>
    <div class="mui-textfield">
      <input value="${
        savedOptions?.stag ? savedOptions.stag : ''
      }" name="stag" id="app-stag" type="text">
    </div>
  </td>
  <td>
    <div class="mui-textfield">
      <input value="${
        savedOptions?.localhost ? savedOptions.localhost : ''
      }" name="localhost" id="app-localhost" type="text">
    </div>
  </td>
  <td class="js-favicon-dropdown-placeholder">
    <div class="mui-dropdown">
      <button class="mui-btn mui-btn--primary js-icon-dropdown" data-mui-toggle="dropdown">
        ${savedOptions?.icon ? getIcon(savedOptions.icon) : 'Favicon'} 
        <span class="mui-caret"></span>
      </button>
      <ul class="mui-dropdown__menu js-icons-list" data-row-index=${rowIndex}>
        ${[
          'rocket',
          'bulb',
          'gingerBread',
          'plane',
          'cookie',
          'paw',
          'location',
          'star',
          'battery',
          'branch',
          'terminal',
          'popcorn',
          'cup',
        ]
          .map(
            (icon, index) =>
              `<li data-icon=${icon} class="js-dropdown-icon">${getIcon(
                icon
              )}</li>`
          )
          .join('')}
      </ul>
    </div>
    <input hidden name="icon" id="app-icon">
  </td>
  <td>
    <button data-row-index=${rowIndex} class="mui-btn mui-btn--small mui-btn--danger js-delete-row">&#65794;</button>
  </td>
</tr>`

/**
 * @param {number} rowIndex
 */
function appendNewRowApp(rowIndex, savedOptions = undefined) {
  document
    .querySelector('.js-app-row-target')
    .insertAdjacentHTML('beforeend', emptyRow(rowIndex, savedOptions))
}

function canOptionBeenSaved(saveBtn) {
  const options = [
    ...document.querySelectorAll('.js-to-validate'),
  ].map((input) => input.hasAttribute('required'))

  options.length > 0 && options.every((item) => !item)
    ? saveBtn.removeAttribute('disabled')
    : saveBtn.setAttribute('disabled', 'true')
}

function validateRequiredInput(optionCallback, btn) {
  const handleRequiredAttr = (elem) => {
    if (elem.value.trim().length > 0) {
      elem.removeAttribute('required')
    } else {
      elem.setAttribute('required', 'true')
    }
    optionCallback(btn)
  }
  document.querySelectorAll('.js-to-validate').forEach((input) => {
    handleRequiredAttr(input)

    input.addEventListener('keyup', (e) => {
      handleRequiredAttr(e.target)
    })
  })
}

function selectIconHandler() {
  ;[...document.querySelectorAll('.js-dropdown-icon')].forEach((icon) => {
    icon.addEventListener('click', (e) => {
      const iconName = e.target.dataset.icon
      const rowIndex = e.target.parentElement.dataset.rowIndex
      const currentRow = document.querySelector(`#row-${rowIndex}`)
      const svg = e.target.querySelector('svg')
      const dropdownBtn = currentRow.querySelector('.js-icon-dropdown')

      dropdownBtn.innerHTML = svg.outerHTML
      currentRow
        .querySelector('input[hidden]#app-icon')
        .setAttribute('value', iconName)
    })
  })
}

function deleteRowHandler(saveBtn) {
  document.querySelectorAll('.js-delete-row').forEach((btn) => {
    btn.addEventListener('click', function handler(e) {
      const rowIndex = e.target.dataset.rowIndex
      const rowToDelete = document.querySelector(`#row-${rowIndex}`)

      rowToDelete.remove()
      reAssignRowIndexes()
      canOptionBeenSaved(saveBtn)
      document.removeEventListener('click', handler)
    })
  })
}

function reAssignRowIndexes() {
  const rowsCount = document.querySelectorAll('.js-app-row')

  rowsCount.forEach((row, index) => {
    // new index for row
    row.setAttribute('id', `row-${index}`)

    // new index for list of icons
    row.querySelector('.js-icons-list').setAttribute('data-test', `${index}`)

    // new index for delete btn
    row.querySelector('.js-delete-row').setAttribute('data-test', `${index}`)
  })
}

document.addEventListener('DOMContentLoaded', (e) => {
  const saveBtn = document.querySelector('.js-save-options')

  extensionStorage.get('inputs').then((resp) => {
    if (resp && resp.length > 0) {
      resp.forEach((item, index) => {
        appendNewRowApp(index, item)
      })
      selectIconHandler()
      canOptionBeenSaved(saveBtn)
      validateRequiredInput(canOptionBeenSaved, saveBtn)
      deleteRowHandler(saveBtn)
    } else {
      document.querySelector('.js-clone-node').click()
    }
  })

  // cloning data row
  document
    .querySelector('.js-clone-node')
    .addEventListener('click', function cloneNodeHandler() {
      const rowIndex = document.querySelectorAll('.js-app-row').length
      appendNewRowApp(rowIndex)
      selectIconHandler()
      canOptionBeenSaved(saveBtn)
      validateRequiredInput(canOptionBeenSaved, saveBtn)
      deleteRowHandler(saveBtn)

      document.removeEventListener('click', cloneNodeHandler)
    })

  // Saving options
  saveBtn.addEventListener('click', function saveOptionsHandler(e) {
    e.preventDefault()
    const inputs = [...document.querySelectorAll('.js-app-row')]
      .map((item) => [...item.children])
      .map((item) =>
        item
          .map((item) => item.querySelector('input'))
          .filter((item) => item && item.value.length > 0)
          .reduce(
            (acc, prev) => ({
              ...acc,
              [prev.name]: prev.value,
            }),
            {}
          )
      )

    chrome.runtime.sendMessage(setAction(OPTIONS_SAVED, { inputs }))
    document.removeEventListener('click', saveOptionsHandler)
  })
})
