'use strict';

window.Sudoku = window.Sudoku ?? (() => {
  const COL_BASE_CP = 'A'.codePointAt(0)
  const COLUMNS = Array(CONFIG.scale).fill(0).map((_, i) => String.fromCodePoint(COL_BASE_CP+i))
  const ROWS = Array(CONFIG.scale).fill(0).map((_, i) => 1+i)

  const cells = new Map()
  var focusedCell = null

  var $numbers = [undefined], $commands, $eliminateByRules

  function init() {
    const $grid = $E('div.grid')

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
        $E('div.cell-'+keyOf(rowId, colId), $grid).addEventListener('click', () => onFocus(rowId, colId))
      })
    })

    const $keys = $E('div.keys')
    $keys.innerHTML = ROWS.reduce((rows, rowId) => rows + `
      <div class="key key-${rowId}">${rowId}</div>`, '') + `
      <div class="key key-clean">⌫</div>`
    ROWS.forEach((number) => {
      const $number = $E('div.key-'+number, $keys)
      $numbers.push($number)
      $number.addEventListener('click', () => onKeyPress(number))
    })
    $E('div.key-clean', $keys).addEventListener('click', onCleanFocused)

    $commands = $E('div.commands')
    $eliminateByRules = $E('#eliminate-by-rules', $commands)
    $eliminateByRules.addEventListener('click', onEliminateByRules)

    window.addEventListener("assumption-started", onAssumptionStarted)
    window.addEventListener("assumption-accepted", onAssumptionEnded)
    window.addEventListener("assumption-rejected", onAssumptionEnded)
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
        const key = keyOf(rowId, colId)
        cells.set(key, new Cell(key, row[colIndex], 'seed'))
      })
    })
  }

  function show() {
    const cssClass = Assumptions.peek().cssClass
    cells.forEach(cell => cell.render(cssClass))
  }

  function onFocus(rowId, colId) {
    if(focusedCell) {
      const {rowId, colId} = focusedCell
      const key = keyOf(rowId, colId)
      const cell = cells.get(key)
      cell.focus(false)
    }

    $commands.classList.remove('hide')

    focusedCell = {rowId, colId}
    const key = keyOf(rowId, colId)
    const cell = cells.get(key)

    cell.focus(true)
    $eliminateByRules.classList.toggle('hide', cell.settled)
    highlightCandidates(cell)
    Assumptions.renderOptionsFor(cell)
  }

  function highlightCandidates(cell) {
    const candidates = cell?.candidates ?? []
    Cell.CANDIDATES.forEach((candidate) => {
      $numbers[candidate].classList.toggle('candidate', candidates.has(candidate))
    })
  }

  function onKeyPress(number) {
    if(!focusedCell) return

    const {rowId, colId} = focusedCell
    const key = keyOf(rowId, colId)
    const cell = cells.get(key)
    const candidates = cell.candidates
    if(!candidates.delete(number)) candidates.add(number)
    cell.value = [...candidates]
    onCellValueChanged(cell)
  }

  function onCleanFocused() {
    if(!focusedCell) return

    const {rowId, colId} = focusedCell
    const key = keyOf(rowId, colId)
    const cell = cells.get(key)
    cell.value = 0
    onCellValueChanged(cell)
  }

  function onCellValueChanged(cell) {
    cell.render(Assumptions.peek().cssClass)
    highlightCandidates(cell)
    Assumptions.renderOptionsFor(cell)
  }

  function onEliminateByRules() {
    if(!focusedCell) return

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

    const candidates = new Set(Cell.CANDIDATES)
    keys.forEach((key) => {
      const cell = cells.get(key)
      if(cell.settled) candidates.delete(cell.value)
    })

    const key = keyOf(rowId, colId)
    const cell = cells.get(key)
    cell.value = [...candidates]
    onCellValueChanged(cell)
  }

  function onAssumptionStarted(event) {
    const {key, value} = event.detail
    const cell = cells.get(key)
    cell.value = value
    onCellValueChanged(cell)
  }

  function onAssumptionEnded(event) {
    console.debug("[DEBUG] Calling onAssumptionEnded(%o) ...", event)

    // TODO: track if focused cell is impacted
    event.detail.decorations.forEach((decoration, cells) => {
      cells.forEach((cell) => cell.render(decoration))
    })

    // if(focusedCell) {
    //   const {rowId, colId} = focusedCell
    //   const key = keyOf(rowId, colId)
    //   const cell = cells.get(key)
    //   cell.focus(false)
    //   focusedCell = null
    // }
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
