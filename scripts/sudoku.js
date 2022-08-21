'use strict';

class Cell {
  candidates
  value
  type

  constructor(value, type) {
    this.candidates = []
    this.value = value ? value.toString() : ' '
    this.type = type ?? 'seed'
  }

  settle(value) {
    this.value = value ? value.toString() : ' '
    this.type = 'settled'
  }
}

window.Sudoku = window.Sudoku ?? (() => {
  const COLUMNS = Array(CONFIG.scale).fill(0).map((_, i) => String.fromCodePoint(65+i))
  const ROWS = Array(CONFIG.scale).fill(0).map((_, i) => 1+i)

  let $grid = {}
  let cells = new Map()

  function init() {
    $grid = $E('div.grid')

    $grid.innerHTML = ROWS.reduce((rows, rowId) => rows + `
      <div class="row row-${rowId}">${COLUMNS.reduce((cols, colId) => cols +
        `<div class="col col-${colId} cell cell-${cellId(rowId, colId)}"></div>`, '')}
        <div class="col y-axis coord"><div class="value">${rowId}</div></div>
      </div>`, '') + `
      <div class="row x-axis">${COLUMNS.reduce((cols, colId) => cols +
        `<div class="col col-${colId} coord"><div class="value">${colId}</div></div>`, '')}
      </div>`
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
        cells.set(cellId(rowId, colId), new Cell(row[colIndex]))
      })
    })
  }

  function show() {
    ROWS.forEach((rowId) => {
      COLUMNS.forEach((colId) => {
        const key = cellId(rowId, colId)
        const cell = cells.get(key)
        $E('div.cell-'+key, $grid).innerHTML = `<div class="value ${cell.type}">${cell.value}</div>`
      })
    })
  }

  function cellId(rowId, colId) {
    return colId + rowId
  }

  return {
    init,
    seed,
    show
  }
})()
