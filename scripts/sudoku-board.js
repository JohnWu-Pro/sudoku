'use strict';

window.Board = window.Board ?? (() => {
  const state = {
    cells: new Map(),
    givens: [],
    focused: null,
    status: '' // filling-givens | solving | solved
  }

  var $numbers = [undefined], $counts = [undefined], $eliminateByRules

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
      <div class="key key-${number}">
        <div class="value">${number}</div>
        <div class="count">0</div>
      </div>
      `, '')
    numbers.forEach((number) => {
      const $number = $E('div.key-'+number, $keys)
      $numbers.push($number)
      $number.addEventListener('click', () => onKeyPress(number))
      $counts.push($E('div.count', $number))
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
   * @param {boolean} fillingGivens whether to start manually filling in givens
   */
  function load(givens, fillingGivens = false) {
    Assumptions.clear()

    state.givens = givens
    state.status = fillingGivens ? 'filling-givens' : 'solving'

    if(givens === Givens.EMPTY) {
      Grid.keys().forEach(key =>
        state.cells.set(key, new Cell(key, 0))
      )
    } else if(givens === Givens.FILLED) {
      state.cells.forEach(cell => {
        if(cell.solved) state.cells.set(cell.key, new Cell(cell.key, cell.value, undefined, 'given'))
      })
      state.givens = matrixFrom(state.cells)
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

    clearSameValue()
    clearCrossHatching()
    highlightCandidates()
    updateNumberCounts()
    updateCommands(true)
    Assumptions.render()
    Assumptions.renderOptionsFor()

    return Promise.resolve()
  }

  function matrixFrom(cells) {
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
    return load(state.givens, state.status === 'filling-givens')
  }

  function onFocus(key) {
    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = key

    const cell = state.cells.get(key)
    cell.focus(true)
    highlightSameValue(cell)
    highlightCandidates(cell)

    if(state.status === 'filling-givens') return

    updateCommands(cell.solved)
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
    if(state.status === 'solved') return
    if(!state.focused) return

    const cell = state.cells.get(state.focused)

    if(state.status === 'filling-givens') {
      cell.value = cell.value === number ? '' : number
    } else {
      const candidates = cell.candidates
      if(!candidates.delete(number)) candidates.add(number)
      cell.value = [...candidates]
    }

    onValueChanged(cell)
  }

  function onUndo() {
    if(state.status === 'solved') return

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

    clearSameValue()
    clearCrossHatching()

    const cell = new Cell(key, value, cssClass)
    state.cells.set(key, cell)
    onValueChanged(cell)

    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = key
    cell.focus(true)
  }

  function onCleanFocused() {
    if(state.status === 'solved') return
    if(!state.focused) return

    const cell = state.cells.get(state.focused)
    cell.value = ''
    onValueChanged(cell)
  }

  function clearSameValue() {
    // Clear existing same-value highlights
    $A('div.grid div.cell.same').forEach(div => div.classList.remove('same'))
  }

  function highlightSameValue(cell) {
    if(cell.solved || cell.value !== '') clearSameValue()
    if(!cell.solved) return

    const {value} = cell
    state.cells.forEach(same => {
      if(same.value !== value) return

      same.div().classList.add('same')
    })
  }

  function clearCrossHatching() {
    // Clear existing cross-hatching marks
    $A('div.grid div.cell > div.excluded').forEach(div => div.remove())
  }

  function markCrossHatching(cell) {
    if(cell.solved || cell.value !== '') clearCrossHatching()
    if(!cell.solved) return

    const {value} = cell
    const markedKeys = new Set()
    state.cells.forEach((same, key) => {
      if(same.value !== value) return

      Grid.peers(key).forEach(peerKey => {
        const peer = state.cells.get(peerKey)
        if(!peer.solved && !markedKeys.has(peerKey)) {
          appendElement('div', {className: 'excluded'}, peer.div()).innerHTML = value
          markedKeys.add(peerKey)
        }
      })
    })
  }

  function onValueChanged(cell) {
    cell.render()
    highlightSameValue(cell)
    highlightCandidates(cell)
    delay(1)
    .then(() => updateNumberCounts())
    .then(() => validate(cell))
    .then((valid) => { if(valid) checkCompletion() })

    if(state.status === 'filling-givens') return

    updateCommands(cell.solved)
    markCrossHatching(cell)
    Assumptions.renderOptionsFor(cell)
  }

  function updateCommands(solved) {
    $toggle($eliminateByRules, solved)
    $A('.commands .buttons button span').forEach(span => $toggle(span, !solved))
  }

  function updateNumberCounts() {
    const counts = Array(Config.scale + 1).fill(0)
    state.cells.forEach(({value, solved}) => {
      if(solved) counts[Number(value)]++
    })

    for(let index=1; index<=Config.scale; index++) {
      $counts[index].innerHTML = counts[index]
    }
  }

  function validate(cell) {
    if(!cell.solved) return undefined

    for(const [house, keys] of Grid.houses(cell.key)) {
      if(duplicates(cell, keys)) {
        Prompt.error(`Cell ${cell.key} value '${cell.value}' is duplicated in its ${house}.`)
        return false
      }
    }

    return true
  }

  function duplicates(cell, keys) {
    const {key, value} = cell
    for(const k of keys) {
      if(k === key) continue
      const cell = state.cells.get(k)
      if(cell.value === value) return true
    }
    return false
  }

  function checkCompletion() {
    if(isCompleted()) {
      state.status = 'solved'
      Assumptions.trigger('accept', Assumptions.peek().id)

      // const givens = Givens.stringify(state.givens)
      // const solution = Givens.stringify(matrixFrom(state.cells))
      window.dispatchEvent(new CustomEvent('puzzle-solved' /* , {
        detail: {givens, solution}
      } */))
    }
  }

  function isCompleted() {
    for(const [house, houses] of Grid.HOUSES) {
      for(const [houseId, keys] of houses) {
        const values = new Set()
        for(const key of keys) {
          const {value, solved} = state.cells.get(key)
          if(!solved) return false
          if(values.has(value)) {
            Prompt.error(`Cell ${key} value '${value}' is duplicated in ${singular(house)}-${houseId}.`)
            return false
          }
          values.add(value)
        }
        if(values.size !== Config.scale) return false
      }
    }
    return true
  }

  function singular(word) {
    return word.replaceAll(/e?s$/g, '')
  }

  function onEliminateByRules() {
    if(!state.focused) return

    const candidates = new Set(Cell.CANDIDATES)
    Grid.peers(state.focused).forEach(key => {
      const cell = state.cells.get(key)
      if(cell.solved) candidates.delete(cell.value)
    })

    const cell = state.cells.get(state.focused)
    cell.value = [...candidates]
    onValueChanged(cell)
  }

  function onAssumptionStarted(event) {
    // console.debug("[DEBUG] Calling onAssumptionStarted(%o) ...", event)

    const {key, value} = event.detail
    const cell = state.cells.get(key)
    cell.value = value
    onValueChanged(cell)
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

    clearSameValue()
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
