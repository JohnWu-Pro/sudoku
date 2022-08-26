'use strict';

window.Sudoku = window.Sudoku ?? (() => {
  const LETTERS = 'ABCDEFGHIJKLMOPQ'
  const COLUMNS = Array(CONFIG.scale).fill(0).map((_, i) => LETTERS.substring(i,i+1))
  const ROWS = Array(CONFIG.scale).fill(0).map((_, i) => 1+i)

  const cells = new Map()
  var focused = null

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
        const key = keyOf(rowId, colId)
        $E('div.cell-' + key, $grid).addEventListener('click', () => onFocus(key))
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
    window.addEventListener("assumption-accepted", onAssumptionAccepted)
    window.addEventListener("assumption-rejected", onAssumptionRejected)
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

    Prompt.info('Tap or click the cell for more supportive actions.')
  }

  function onFocus(key) {
    if(focused) {
      cells.get(focused).focus(false)
    }
    focused = key

    $commands.classList.remove('hide')

    const cell = cells.get(key)
    cell.focus(true)
    highlightCandidates(cell)
    $eliminateByRules.classList.toggle('hide', cell.settled)
    Assumptions.renderOptionsFor(cell)
  }

  function highlightCandidates(cell) {
    const candidates = cell?.candidates ?? []
    Cell.CANDIDATES.forEach((candidate) => {
      $numbers[candidate].classList.toggle('candidate', candidates.has(candidate))
    })
  }

  function onKeyPress(number) {
    if(!focused) return

    const cell = cells.get(focused)
    const candidates = cell.candidates
    if(!candidates.delete(number)) candidates.add(number)
    cell.value = [...candidates]
    onCellValueChanged(cell)
  }

  function onCleanFocused() {
    if(!focused) return

    const cell = cells.get(focused)
    cell.value = 0
    onCellValueChanged(cell)
  }

  function onCellValueChanged(cell) {
    cell.render(Assumptions.peek().cssClass)
    highlightCandidates(cell)
    $eliminateByRules.classList.toggle('hide', cell.settled)
    Assumptions.renderOptionsFor(cell)
  }

  function onEliminateByRules() {
    if(!focused) return

    const {rowId, colId} = idsFrom(focused)
    if(!rowId) return

    const keys = new Set()
    COLUMNS.forEach((colId) => {
      keys.add(keyOf(rowId, colId))
    })
    ROWS.forEach((rowId) => {
      keys.add(keyOf(rowId, colId))
    })

    const leftCol = Math.floor(LETTERS.indexOf(colId) / CONFIG.box) * CONFIG.box
    const topRowId = Math.floor((rowId - 1) / CONFIG.box) * CONFIG.box + 1
    Array(CONFIG.box).fill(0).map((_, i) => topRowId+i).forEach((rowId) => {
      for(const colId of LETTERS.substring(leftCol, leftCol + CONFIG.box)) {
        keys.add(keyOf(rowId, colId))
      }
    })

    const candidates = new Set(Cell.CANDIDATES)
    keys.forEach((key) => {
      const cell = cells.get(key)
      if(cell.settled) candidates.delete(cell.value)
    })

    const cell = cells.get(focused)
    cell.value = [...candidates]
    onCellValueChanged(cell)
  }

  function onAssumptionStarted(event) {
    // console.debug("[DEBUG] Calling onAssumptionStarted(%o) ...", event)

    const {key, value} = event.detail
    const cell = cells.get(key)
    cell.value = value
    onCellValueChanged(cell)
  }

  function onAssumptionAccepted(event) {
    event.detail.affected.forEach(key => {
      cells.get(key).render()
    })
  }

  function onAssumptionRejected(event) {
    let started = null
    event.detail.affected.forEach((affected, cssClass) => {
      affected.forEach(cell => {
        cells.set(cell.key, cell)
        cell.render(cssClass)
        started = cell.key
      })
    })

    onFocus(started)
  }

  function keyOf(rowId, colId) {
    return colId + rowId
  }

  function idsFrom(key) {
    const [matched, colId, rowId] = key?.match(/^([A-Z])(\d+)$/) ?? []
    return matched ? {rowId: Number(rowId), colId} : {}
  }

  return {
    init,
    seed,
    show
  }
})()
