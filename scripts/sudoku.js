'use strict';

class Cell {
  #value // single value (0, or 1..max), or values array
  #status
  #assumptions

  constructor(val, status) {
    this.#status = status
    this.value = val
    this.#assumptions = []
  }

  get candidates() {
    const array = Array.isArray(this.#value) ? this.#value : (this.#value ? [this.#value] : [])
    return new Set(array)
  }

  get value() {
    return this.#value
  }
  set value(val) {
    if(! val) {
      this.#value = 0
    } else if(Array.isArray(val)) {
      this.#value = val.length === 0 ? 0 : (val.length === 1 ? Cell.#normalize(val[0]) : val.sort())
    } else {
      this.#value = Cell.#normalize(val)
    }
    this.#status = this.settled ? (this.#status === 'seed' ? 'seed' : 'settled') : 'pending'
  }

  get status() {
    return this.#status
  }

  get assumption() {
    for(const val of this.#assumptions) {
      if(val.status === 'Pending') return val
    }
    return null
  }
  set assumption(val) {
    this.#assumptions.push(val)
  }

  get settled() { // single value in 1..max
    return Array.isArray(this.#value) ? false : this.#value !== 0
  }

  get html() {
    let text = Array.isArray(this.#value) ? this.#value.join('') : (this.#value || '')
    if(text.length > 5) text = '...'
    return `<div class="value ${this.status}">${text}</div>`
  }

  static #normalize(val) {
    val = Number(val)
    return (0 < val && val <= CONFIG.scale) ? val : 0
  }
}

class Assumption {
  static ALL_IDS = ['if-1st', 'if-2nd', 'if-3rd']
  static availableIds = [...Assumption.ALL_IDS]
  static #nextId() {
    return Assumption.availableIds.shift()
  }
  static allowMore() {
    return Assumption.availableIds.length > 0
  }
  static findById(assumptions, id) {
    for(const assumption of assumptions) {
      if(assumption.id === id) return assumption
    }
    return null
  }

  #id
  #cellKey
  #cellValue
  #label
  #status

  constructor(cellKey, cellValue, label) {
    this.#id = Assumption.#nextId()
    this.#cellKey = cellKey
    this.#cellValue = cellValue
    this.#label = label
    this.#status = 'Pending'
  }

  get id() { return this.#id }
  get cellKey() { return this.#cellKey }
  get cellValue() { return this.#cellValue }
  get label() { return this.#label }
  get status() { return this.#status }

  accept() {
    Assumption.availableIds.push(this.#id)
    this.#status = 'Accepted'
  }

  reject() {
    Assumption.availableIds.push(this.#id)
    this.#status = 'Rejected'
  }
}

window.Sudoku = window.Sudoku ?? (() => {
  const COL_BASE_CP = 'A'.codePointAt(0)
  const COLUMNS = Array(CONFIG.scale).fill(0).map((_, i) => String.fromCodePoint(COL_BASE_CP+i))
  const ROWS = Array(CONFIG.scale).fill(0).map((_, i) => 1+i)
  const CANDIDATES = new Set(ROWS)

  const cells = new Map()
  const assumptions = []
  var focusedCell = null

  var $grid, $keys = [undefined], $commands, $eliminateByRules, $message

  function init() {
    $grid = $E('div.grid')

    $grid.innerHTML = ROWS.reduce((rows, rowId) => rows + `
      <div class="row row-${rowId}">${COLUMNS.reduce((cols, colId) => cols +
        `<div class="col col-${colId} cell cell-${keyOf(rowId, colId)}"></div>`, '')}
        <div class="col y-axis coord"><div class="value">${rowId}</div></div>
      </div>`, '') + `
      <div class="row x-axis">${COLUMNS.reduce((cols, colId) => cols +
        `<div class="col col-${colId} coord"><div class="value">${colId}</div></div>`, '')}
      </div>`

    ROWS.forEach((rowId) => {
      COLUMNS.forEach((colId) => {
        $cell(rowId, colId).addEventListener('click', () => onFocus(rowId, colId))
      })
    })

    const keysDiv = $E('div.keys')
    keysDiv.innerHTML = ROWS.reduce((rows, rowId) => rows + `
      <div class="key key-${rowId}">${rowId}</div>`, '') + `
      <div class="key key-clean">⌫</div>`
    ROWS.forEach((number) => {
      const $key = $E('div.key-'+number, keysDiv)
      $keys.push($key)
      $key.addEventListener('click', () => onKeyPress(number))
    })
    $E('div.key-clean', keysDiv).addEventListener('click', onCleanFocused)

    $commands = $E('div.commands')
    $eliminateByRules = $E('#eliminate-by-rules', $commands)
    $eliminateByRules.addEventListener('click', onEliminateByRules)

    $message = $E('div.message')
  }

  /**
   * Set the Sudoku's seed data. The data should be an array, each element represents a row.
   * Each row itself is an array, each element represents a cell in that row.
   * The cell value can be 1, 2, 3, ..., max. And the zero (`0`) indicates no value yet.
   *
   * @param {array} data the Sudoku's seed data
   */
  function seed(data) {
    ROWS.forEach((rowId, rowIndex) => {
      const row = data[rowIndex]
      COLUMNS.forEach((colId, colIndex) => {
        cells.set(keyOf(rowId, colId), new Cell(row[colIndex], 'seed'))
      })
    })
  }

  function show() {
    ROWS.forEach((rowId) => {
      COLUMNS.forEach((colId) => {
        renderCell(keyOf(rowId, colId))
      })
    })
  }

  function onFocus(rowId, colId) {
    if(focusedCell) {
      const {rowId, colId} = focusedCell
      $cell(rowId, colId).classList.remove('focused')
    }

    focusedCell = {rowId, colId}
    const key = keyOf(rowId, colId)
    const cell = cells.get(key)

    $cell(rowId, colId).classList.add('focused')
    $commands.classList.remove('hide')
    $eliminateByRules.classList.toggle('hide', cell.settled)

    toggleHighlightedKeys(cell)
    renderPendingAssumptions()
    renderTentativeAssumption(key, cell)
  }

  function toggleHighlightedKeys(cell) {
    const candidates = cell.candidates
    ROWS.forEach((number) => {
      $keys[number].classList.toggle('candidate', candidates.has(number))
    })
  }

  function renderPendingAssumptions() {
    const div = $E('div.pending', $commands)
    if(assumptions.length === 0) {
      div.innerHTML = ''
      return
    }

    div.innerHTML = assumptions.reduce((html, assumption) => html + `
      <div class="assumption">
        <span class="${assumption.id}">${assumption.label}:</span>
        <button data-id="${assumption.id}" data-action="accept">Accept</button>
        <button data-id="${assumption.id}" data-action="reject">Reject</button>
      </div>
      `, '')

    // attach event handler
    $A('div.pending button', $commands).forEach((button) => {
      button.addEventListener('click', onEndAssumption)
    })
  }

  function renderTentativeAssumption(key, cell) {
    const div = $E('div.tentative', $commands)
    if(cell.settled) {
      div.innerHTML = ''
      return
    }
    if(!Assumption.allowMore()) {
      div.innerHTML = ''
      $message.innerHTML = 'Too many assumptions!'
      return
    }

    const candidates = [...cell.candidates]
    if(candidates.length === 0) candidates.push(...CANDIDATES)

    div.innerHTML = `
      <select>${candidates.reduce((html, number) => html +
        `<option value="assume ${key} is ${number}">Assume ${key} is ${number}</option>`,
        `<option value="">Assume ${key} is ...</option>`)}
      </select>
    `
    // attach event handler to start assumption
    $E('div.tentative > select', $commands).addEventListener('change', onStartAssumption)
  }

  function onKeyPress(number) {
    if(!focusedCell) return

    const {rowId, colId} = focusedCell
    const key = keyOf(rowId, colId)
    const cell = cells.get(key)
    const candidates = cell.candidates
    if(!candidates.delete(number)) candidates.add(number)
    cell.value = [...candidates]
    toggleHighlightedKeys(cell)
    renderTentativeAssumption(key, cell)
    renderCell(key, cell)
  }

  function onCleanFocused() {
    if(!focusedCell) return

    const {rowId, colId} = focusedCell
    const key = keyOf(rowId, colId)
    const cell = cells.get(key)
    cell.value = 0
    toggleHighlightedKeys(cell)
    renderTentativeAssumption(key, cell)
    renderCell(key, cell)
  }

  function onEliminateByRules() {
    const {rowId, colId} = focusedCell

    const keys = new Set()
    COLUMNS.forEach((colId) => {
      keys.add(keyOf(rowId, colId))
    })
    ROWS.forEach((rowId) => {
      keys.add(keyOf(rowId, colId))
    })

    const leftCol = Math.floor((colId.codePointAt(0) - COL_BASE_CP) / 3) * 3 + COL_BASE_CP
    const topRowId = Math.floor((rowId - 1) / 3) * 3 + 1
    Array(topRowId, topRowId+1, topRowId+2).forEach((rowId) => {
      [String.fromCodePoint(leftCol), String.fromCodePoint(leftCol+1), String.fromCodePoint(leftCol+2)].forEach((colId) => {
        keys.add(keyOf(rowId, colId))
      })
    })

    const candidates = new Set(CANDIDATES)
    keys.forEach((key) => {
      const cell = cells.get(key)
      if(cell.settled) candidates.delete(cell.value)
    })

    const key = keyOf(rowId, colId)
    const cell = cells.get(key)
    cell.value = [...candidates]

    toggleHighlightedKeys(cell)
    renderTentativeAssumption(key, cell)
    renderCell(key, cell)
  }

  function onStartAssumption(event) {
    const option = firstOf(event.target.selectedOptions)
    if(!option) return

    const value = option.value
    if(!value) return

    const [_, key, number] = value.match(/^assume ([A-Z]\d) is (\d)$/) ?? []
    if(!key) return

    // TODO: Save the state snapshot

    const cell = cells.get(key)
    cell.value = number
    assumptions.push(cell.assumption = new Assumption(key, number, option.text))

    toggleHighlightedKeys(cell)
    renderPendingAssumptions()
    renderTentativeAssumption(key, cell)
    renderCell(key, cell)
  }

  function onEndAssumption(event) {
    const dataset = event.target.dataset
    const id = dataset.id
    const action = dataset.action

    console.debug("[DEBUG] Going to %s assumption(id: %s) ...", action, id)
  }

  function onAcceptAssumption(assumption) {
    // Accept assumption in cells
    // Remove saved state snapshot
    assumption.accept()
  }

  function onRejectAssumption(assumption) {
    // Rollback state
    assumption.reject()
  }

  function renderCell(key, cell) {
    const cellContainer = $E('div.cell-'+key, $grid)
    cell ??= cells.get(key)
    cellContainer.innerHTML = cell.html

    cellContainer.classList.remove(...Assumption.ALL_IDS)
    if(cell.assumption) {
      cellContainer.classList.add(cell.assumption.id)
    }
  }

  function $cell(rowId, colId) {
    return $E('div.cell-'+keyOf(rowId, colId), $grid)
  }

  function keyOf(rowId, colId) {
    return colId + rowId
  }

  return {
    init,
    seed,
    show
  }
})()
