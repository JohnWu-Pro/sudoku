'use strict';

window.Sudoku = window.Sudoku ?? (() => {
  const LETTERS = 'ABCDEFGHIJKLMOPQ'
  const COLUMNS = Array(CONFIG.scale).fill(0).map((_, i) => LETTERS.substring(i,i+1))
  const ROWS = Array(CONFIG.scale).fill(0).map((_, i) => 1+i)

  const state = {
    cells: new Map(),
    seed: [],
    focused: null,
    seeding: false
  }

  var $numbers = [undefined], $eliminateByRules

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
    const numbers = Array(...Cell.CANDIDATES)
    $keys.innerHTML = numbers.reduce((html, number) => html + `
      <div class="key key-${number}"><div class="value">${number}</div></div>`, '')
    numbers.forEach((number) => {
      const $number = $E('div.key-'+number, $keys)
      $numbers.push($number)
      $number.addEventListener('click', () => onKeyPress(number))
    })

    const $commands = $E('div.commands')
    $E('button#undo', $commands).addEventListener('click', onUndo)
    $E('button#clean', $commands).addEventListener('click', onCleanFocused)
    $eliminateByRules = $E('#eliminate-by-rules', $commands)
    $eliminateByRules.addEventListener('click', onEliminateByRules)

    window.addEventListener("assumption-started", onAssumptionStarted)
    window.addEventListener("assumption-accepted", onAssumptionAccepted)
    window.addEventListener("assumption-rejected", onAssumptionRejected)
  }

  /**
   * Show the Sudoku grid. The seed should be an array, each element represents a row.
   * Each row itself is an array, each element represents a cell in that row.
   * The cell value can be 1, 2, 3, ..., max. And the zero (`0`) indicates no value yet.
   *
   * @param {array} seed the Sudoku given numbers
   * @param {boolean} seeding whether to start manual seeding
   */
  function start(seed, seeding = false) {
    state.seeding = seeding

    if(seed === Seed.EMPTY) {
      ROWS.forEach((rowId) => {
        COLUMNS.forEach((colId) => {
          const key = keyOf(rowId, colId)
          state.cells.set(key, new Cell(key, 0))
        })
      })
    } else if(seed === Seed.FILLED) {
      state.cells.forEach(cell => {
        if(cell.settled) state.cells.set(cell.key, new Cell(cell.key, cell.value, undefined, 'seed'))
      })
    } else {
      ROWS.forEach((rowId, rowIndex) => {
        const row = seed[rowIndex]
        COLUMNS.forEach((colId, colIndex) => {
          const key = keyOf(rowId, colId)
          state.cells.set(key, new Cell(key, row[colIndex], undefined, 'seed'))
        })
      })
    }

    state.cells.forEach(cell => cell.render())

    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = null

    updateCommands(true)
    Assumptions.clear()
    Assumptions.render()
    Assumptions.renderOptionsFor(null)

    return Promise.resolve()
  }

  function pause() {

  }

  function resume() {

  }

  function reload() {

  }

  function onFocus(key) {
    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = key

    const cell = state.cells.get(key)
    cell.focus(true)
    highlightCandidates(cell)

    if(state.seeding) return

    updateCommands(cell.settled)
    markCrossHatching(cell)
    Assumptions.renderOptionsFor(cell)
  }

  function highlightCandidates(cell) {
    const candidates = cell?.candidates ?? []
    Cell.CANDIDATES.forEach((candidate) => {
      $numbers[candidate].classList.toggle('candidate', candidates.has(candidate))
    })
  }

  function onKeyPress(number) {
    if(!state.focused) return

    const cell = state.cells.get(state.focused)

    if(state.seeding) {
      cell.value = cell.value === number ? 0 : number
    } else {
      const candidates = cell.candidates
      if(!candidates.delete(number)) candidates.add(number)
      cell.value = [...candidates]
    }

    onCellValueChanged(cell)
  }

  function onUndo() {
    const assumption = Assumptions.peek()
    if(assumption.isEmpty()) {
      Prompt.info('No more step to undo!')
      return
    }

    const {key, value, cssClass} = assumption.pop()
    if(assumption.isEmpty()) { // check empty after pop()
      assumption.reject()
      Assumptions.pop()
      Assumptions.render()
    }

    const cell = new Cell(key, value, cssClass)
    state.cells.set(key, cell)
    onCellValueChanged(cell)

    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = key
    cell.focus(true)
  }

  function onCleanFocused() {
    if(!state.focused) return

    const cell = state.cells.get(state.focused)
    cell.value = 0
    onCellValueChanged(cell)
  }

  function markCrossHatching(cell) {
    if(!cell.settled) return

    // clear existing cross-hatching marks
    $A('div.grid div.cell > div.cross-hatching').forEach(div => div.remove())

    const value = cell.value
    const markedKeys = new Set()
    state.cells.forEach(cell => {
      if(cell.value === value) crossHatchingRowAndColumn(markedKeys, cell)
    })
  }

  function crossHatchingRowAndColumn(markedKeys, cell) {
    const value = cell.value
    const {rowId, colId} = idsFrom(cell.key)

    const keys = new Set()
    COLUMNS.forEach(colId => keys.add(keyOf(rowId, colId)))
    ROWS.forEach(rowId => keys.add(keyOf(rowId, colId)))

    keys.forEach(key => {
      const cell = state.cells.get(key)
      if(!cell.settled && !markedKeys.has(key)) {
        appendElement('div', {className: 'cross-hatching'}, cell.div()).innerHTML = value
        markedKeys.add(key)
      }
    })
  }

  function onCellValueChanged(cell) {
    cell.render()
    highlightCandidates(cell)

    if(state.seeding) return

    updateCommands(cell.settled)
    markCrossHatching(cell)
    Assumptions.renderOptionsFor(cell)
  }

  function updateCommands(settled) {
    $toggle($eliminateByRules, settled)
    $A('.commands .buttons button span').forEach(span => $toggle(span, !settled))
  }

  function onEliminateByRules() {
    if(!state.focused) return

    const {rowId, colId} = idsFrom(state.focused)
    if(!rowId) return

    const keys = new Set()
    COLUMNS.forEach(colId => keys.add(keyOf(rowId, colId)))
    ROWS.forEach(rowId => keys.add(keyOf(rowId, colId)))

    const leftCol = Math.floor(LETTERS.indexOf(colId) / CONFIG.box) * CONFIG.box
    const topRowId = Math.floor((rowId - 1) / CONFIG.box) * CONFIG.box + 1
    Array(CONFIG.box).fill(0).map((_, i) => topRowId+i).forEach(rowId => {
      for(const colId of LETTERS.substring(leftCol, leftCol + CONFIG.box)) {
        keys.add(keyOf(rowId, colId))
      }
    })

    const candidates = new Set(Cell.CANDIDATES)
    keys.forEach(key => {
      const cell = state.cells.get(key)
      if(cell.settled) candidates.delete(cell.value)
    })

    const cell = state.cells.get(state.focused)
    cell.value = [...candidates]
    onCellValueChanged(cell)
  }

  function onAssumptionStarted(event) {
    // console.debug("[DEBUG] Calling onAssumptionStarted(%o) ...", event)

    const {key, value} = event.detail
    const cell = state.cells.get(key)
    cell.value = value
    onCellValueChanged(cell)
  }

  function onAssumptionAccepted(event) {
    event.detail.affected.forEach(cell => {
      state.cells.set(cell.key, cell)
      cell.render()
    })
  }

  function onAssumptionRejected(event) {
    event.detail.affected.forEach(cell => {
      state.cells.set(cell.key, cell)
      cell.render()
    })

    const affected = event.detail.affected
    onFocus(affected[affected.length-1].key)
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
    pause,
    resume,
    // save & restore,
    reload,
    start
  }
})()
