'use strict';

window.Board = window.Board ?? (() => {
  const state = {
    cells: new Map(),
    givens: [],
    focused: null,
    fillingGivens: false
  }

  var $numbers = [undefined], $eliminateByRules

  function init() {
    const $grid = $E('div.grid')

    $grid.innerHTML = Grid.ROWS.reduce((rows, rowId) => rows + `
      <div class="row row-${rowId}">${Grid.COLUMNS.reduce((cols, colId) => cols +
        `<div class="col col-${colId} cell cell-${Grid.keyOf(rowId, colId)}"></div>`, '')}
        <div class="col y-axis coord"><div class="value">${rowId}</div></div>
      </div>`, '') + `
      <div class="row x-axis">${Grid.COLUMNS.reduce((cols, colId) => cols +
        `<div class="col col-${colId} coord"><div class="value">${colId}</div></div>`, '')}
      </div>`

    Grid.keys().forEach(key => {
      $E('div.cell-' + key, $grid).addEventListener('click', () => onFocus(key))
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

    return Promise.resolve()
  }

  /**
   * Load the Sudoku grid with the givens.
   *
   * The givens are expected to be an array, each element represents a row.
   * Each row itself is an array, each element represents a cell in that row.
   * The cell value can be '1', '2', ..., '9', or empty ('').
   *
   * @param {array} givens the Sudoku given numbers
   * @param {boolean} fillingGivens whether to start manual fillingGivens
   */
  function load(givens, fillingGivens = false) {
    Assumptions.clear()

    state.givens = givens
    state.fillingGivens = fillingGivens

    if(givens === Givens.EMPTY) {
      Grid.keys().forEach(key =>
        state.cells.set(key, new Cell(key, 0))
      )
    } else if(givens === Givens.FILLED) {
      state.cells.forEach(cell => {
        if(cell.settled) state.cells.set(cell.key, new Cell(cell.key, cell.value, undefined, 'given'))
      })
      state.givens = givensFrom(state.cells)
      console.debug("[DEBUG] Filled givens: %o", state.givens)
    } else {
      Grid.ROWS.forEach((rowId, rowIndex) => {
        const row = givens[rowIndex]
        Grid.COLUMNS.forEach((colId, colIndex) => {
          const key = Grid.keyOf(rowId, colId)
          state.cells.set(key, new Cell(key, row[colIndex], undefined, 'given'))
        })
      })
    }

    state.cells.forEach(cell => cell.render())

    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = null

    clearCrossHatching()
    highlightCandidates()
    updateCommands(true)
    Assumptions.render()
    Assumptions.renderOptionsFor()

    return Promise.resolve()
  }

  function givensFrom(cells) {
    const result = Array(Config.scale)

    Grid.ROWS.forEach((rowId, rowIndex) => {
      const row = Array(Config.scale)
      Grid.COLUMNS.forEach((colId, colIndex) => {
        row[colIndex] = cells.get(Grid.keyOf(rowId, colId)).value
      })
      result[rowIndex] = row
    })

    return result
  }

  function reload() {
    return load(state.givens, state.fillingGivens)
  }

  function onFocus(key) {
    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = key

    const cell = state.cells.get(key)
    cell.focus(true)
    highlightCandidates(cell)

    if(state.fillingGivens) return

    updateCommands(cell.settled)
    markCrossHatching(cell)
    Assumptions.renderOptionsFor(cell)
  }

  function highlightCandidates(cell) {
    const candidates = cell?.candidates ?? new Set()
    Cell.CANDIDATES.forEach((candidate) => {
      $numbers[candidate].classList.toggle('candidate', candidates.has(candidate))
    })
  }

  function onKeyPress(number) {
    if(!state.focused) return

    const cell = state.cells.get(state.focused)

    if(state.fillingGivens) {
      cell.value = cell.value === number ? '' : number
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

    clearCrossHatching()

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
    cell.value = ''
    onCellValueChanged(cell)
  }

  function clearCrossHatching() {
    // Clear existing cross-hatching marks
    $A('div.grid div.cell.same').forEach(div => div.classList.remove('same'))
    $A('div.grid div.cell > div.excluded').forEach(div => div.remove())
  }

  function markCrossHatching(cell) {
    if(cell.settled || cell.value !== '') clearCrossHatching()
    if(!cell.settled) return

    const value = cell.value
    const markedKeys = new Set()
    state.cells.forEach(cell => {
      if(cell.value === value) {
        cell.div().classList.add('same')
        crossHatchingRowAndColumn(markedKeys, cell)
      }
    })
  }

  function crossHatchingRowAndColumn(markedKeys, cell) {
    const value = cell.value
    Grid.peers(cell.key).forEach(key => {
      const cell = state.cells.get(key)
      if(!cell.settled && !markedKeys.has(key)) {
        appendElement('div', {className: 'excluded'}, cell.div()).innerHTML = value
        markedKeys.add(key)
      }
    })
  }

  function onCellValueChanged(cell) {
    cell.render()
    highlightCandidates(cell)

    if(state.fillingGivens) return

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

    const candidates = new Set(Cell.CANDIDATES)
    Grid.peers(state.focused).forEach(key => {
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
    const cssClass = Assumption.ACCEPTED.cssClass
    for(const key of event.detail.affected) {
      const cell = new Cell(key, state.cells.get(key).value, cssClass) // Keep current value
      state.cells.set(key, cell)
      cell.render()
    }
  }

  function onAssumptionRejected(event) {
    for(const cell of event.detail.affected) {
      state.cells.set(cell.key, cell) // Bring back previous cell snapshot
      cell.render()
    }

    clearCrossHatching()

    const affected = event.detail.affected
    onFocus(affected[affected.length-1].key)
  }

  return {
    init,
    // save & restore,
    load,
    reload,
  }
})()
