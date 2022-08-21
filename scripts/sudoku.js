'use strict';

class Cell {
  #value // single value (0, or 1..max), or values array
  #status

  constructor(val, status) {
    this.#status = status
    this.value = val
  }

  get candidates() {
    return Array.isArray(this.#value) ? this.#value : (this.#value ? [this.#value] : [])
  }

  get value() {
    return this.#value || ''
  }
  set value(val) {
    if(! val) {
      this.#value = 0
    } else if(Array.isArray(val)) {
      this.#value = val.length === 0 ? 0 : (val.length === 1 ? Cell.#normalize(val[0]) : val)
    } else {
      this.#value = Cell.#normalize(val)
    }
    this.#status = this.settled ? (this.#status === 'seed' ? 'seed' : 'settled') : 'pending'
  }

  get status() {
    return this.#status
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

window.Sudoku = window.Sudoku ?? (() => {
  const COL_BASE_CP = 'A'.codePointAt(0)
  const COLUMNS = Array(CONFIG.scale).fill(0).map((_, i) => String.fromCodePoint(COL_BASE_CP+i))
  const ROWS = Array(CONFIG.scale).fill(0).map((_, i) => 1+i)
  const CANDIDATES = new Set(ROWS)

  const cells = new Map()
  var focusedCell = null

  var $grid, $prompt, $commandPanel

  function init() {
    $grid = $E('div.grid')
    $prompt = $E('div.prompt')
    $commandPanel = $E('div.cmd-panel')

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
        $cell(rowId, colId).addEventListener('click', () => onClick(rowId, colId))
      })
    })

    $E('button#eliminate-by-rules', $commandPanel).addEventListener('click', eliminateByRules)
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
        render(keyOf(rowId, colId))
      })
    })
  }

  function onClick(rowId, colId) {
    if(focusedCell) {
      const {rowId, colId} = focusedCell
      $cell(rowId, colId).classList.remove('focused')
    }
    focusedCell = {rowId, colId}
    $cell(rowId, colId).classList.add('focused')

    $prompt.classList.add('hide')
    $commandPanel.classList.remove('hide')
  }

  function eliminateByRules() {
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
    cells.get(key).value = [...candidates]
    render(key)
  }

  function render(key) {
    $E('div.cell-'+key, $grid).innerHTML = cells.get(key).html
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
