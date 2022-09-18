'use strict';

window.Board = window.Board ?? (() => {
  const state = {
    cells: new Map(),
    givens: [],
    keyMode: 'nominating', // nominating | eliminating
    focused: null,
    status: '' // filling-in-givens | solving | solved
  }

  var $keys, $numberKeys = [undefined], $numberCounts = [undefined], $keyModeCtrl
  var $undo, $eliminateByRules, $markCrossHatching

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

    const numbers = Array(...Cell.CANDIDATES)
    $keys = $E('div.keys')
    $keys.innerHTML = numbers.reduce((html, number) => html + `
      <div class="key key-${number}">
        <div class="value">${number}</div>
        <div class="count"></div>
      </div>
      `, '') + `
      <div class="key key-mode-ctrl">
        <div class="value from-mode">0</div>
        <div class="symbol">⤷</div>
        <div class="value to-mode">0</div>
      </div>
      `
    numbers.forEach((number) => {
      const $numberKey = $E('div.key-'+number, $keys)
      $numberKeys.push($numberKey)
      $numberKey.addEventListener('click', () => onKeyPress(number))
      $numberCounts.push($E('div.count', $numberKey))
    })
    $keyModeCtrl = $E('div.keys .key-mode-ctrl')
    $keyModeCtrl.addEventListener('click', onToggleKeyMode)

    const $commands = $E('div.commands')
    $undo = $E('button#undo', $commands)
    $undo.addEventListener('click', onUndo)
    $E('button#clean', $commands).addEventListener('click', onCleanFocused)
    $eliminateByRules = $E('#eliminate-by-rules', $commands)
    $eliminateByRules.addEventListener('click', onEliminateByRules)
    $markCrossHatching = $E('#mark-cross-hatching', $commands)
    $markCrossHatching.addEventListener('click', onMarkCrossHatching)

    window.addEventListener("assumption-started", onAssumptionStarted)
    window.addEventListener("assumption-accepted", onAssumptionAccepted)
    window.addEventListener("assumption-rejected", onAssumptionRejected)
    window.addEventListener("overlay-closed", onRerender)

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
   * @param {boolean} fillingInGivens whether to start manually filling in givens
   */
  function load(givens, fillingInGivens = false) {
    Assumptions.clear()

    state.givens = givens
    state.keyMode = 'nominating'
    state.status = fillingInGivens ? 'filling-in-givens' : 'solving'

    if(givens === Givens.EMPTY) {
      Grid.keys().forEach(key =>
        state.cells.set(key, new Cell(key, '', ''))
      )
    } else if(givens === Givens.FILLED) {
      state.cells.forEach(({key, value, solved}) => {
        if(solved) state.cells.set(key, new Cell(key, value, '', undefined, 'given'))
      })
      state.givens = matrixFrom(state.cells)
    } else {
      Grid.ROWS.forEach((rowId, rowIndex) => {
        const row = givens[rowIndex]
        Grid.COLUMNS.forEach((colId, colIndex) => {
          const key = Grid.keyOf(rowId, colId)
          state.cells.set(key, new Cell(key, row[colIndex], '', undefined, 'given'))
        })
      })
    }

    return render()
  }

  function render() {
    state.cells.forEach(cell => cell.render())

    if(state.focused) {
      state.cells.get(state.focused).focus(false)
    }
    state.focused = null

    clearSameValue()
    clearCrossHatching()
    highlightCandidates()
    updateKeyMode()
    updateNumberCounts()
    updateCommands()
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
    return load(state.givens, state.status === 'filling-in-givens')
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

    if(state.status === 'filling-in-givens') return

    clearCrossHatching(cell)
    updateCommands(cell.solved)
    Assumptions.renderOptionsFor(cell)
  }

  function highlightCandidates(cell) {
    const candidates = cell ? (isEliminating() ? cell.eliminations : cell.candidates) : new Set()
    Cell.CANDIDATES.forEach((candidate) => {
      $numberKeys[candidate].classList.toggle('candidate', candidates.has(candidate))
    })
  }

  function onKeyPress(number) {
    if(state.status === 'solved') return
    if(!state.focused) return

    const cell = state.cells.get(state.focused)

    if(state.status === 'filling-in-givens') {
      cell.value = cell.value === number ? '' : number
    } else if(isEliminating()) {
      const candidates = cell.eliminations
      if(!candidates.delete(number)) candidates.add(number)
      cell.eliminated = [...candidates]
    } else {
      const candidates = cell.candidates
      if(!candidates.delete(number)) candidates.add(number)
      cell.value = [...candidates]
    }

    clearCrossHatching(cell)
    onValueChanged(cell)
  }

  function onToggleKeyMode() {
    state.keyMode = isEliminating() ? 'nominating' : 'eliminating'
    updateKeyMode()
  }

  function updateKeyMode() {
    $toggle($keyModeCtrl, !Settings.markEliminated || state.status === 'filling-in-givens')

    if(state.status === 'filling-in-givens') return

    $toggle($keys, isEliminating(), 'eliminating')

    const cell = state.focused ? state.cells.get(state.focused) : null
    highlightCandidates(cell)
  }

  function isEliminating() {
    return Settings.markEliminated && state.keyMode === 'eliminating'
  }

  function onUndo() {
    if(!Settings.allowUndo) return
    if(state.status === 'solved') return

    const assumption = Assumptions.peek()
    if(assumption.isEmpty()) {
      Prompt.info(T('board.info.no-more-undo'))
      return
    }

    const {key, value, eliminated, cssClass} = assumption.pop()
    if(assumption.isEmpty()) { // check empty after pop()
      assumption.reject()
      Assumptions.pop()
      Assumptions.render()
    }

    clearSameValue()
    clearCrossHatching()

    const cell = new Cell(key, value, eliminated, cssClass)
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
    cell.eliminated = ''
    onValueChanged(cell)
  }

  function clearSameValue() {
    // Clear existing same-value highlights
    $A('div.grid div.cell.same').forEach(div => div.classList.remove('same'))
  }

  function highlightSameValue(cell) {
    if(!Settings.highlightSolvedSameValue) return

    if(cell.solved || cell.value !== '') clearSameValue()
    if(!cell.solved) return

    const {value} = cell
    state.cells.forEach(same => {
      if(same.value !== value) return

      same.div().classList.add('same')
    })
  }

  function onValueChanged(cell) {
    cell.render()
    highlightSameValue(cell)
    highlightCandidates(cell)
    delay(1)
    .then(() => updateNumberCounts())
    .then(() => checkCorrectnessByRules(cell))
    .then((valid) => { if(valid !== false) checkCompletion() })

    if(state.status === 'filling-in-givens') return

    updateCommands(cell.solved)
    Assumptions.renderOptionsFor(cell)
  }

  function updateCommands(solved) {
    $toggle($undo, !Settings.allowUndo)
    $toggle($eliminateByRules, !Settings.eliminateByRules || solved === undefined || solved)
    $toggle($markCrossHatching, !Settings.markCrossHatching || solved === undefined || !solved)
    $A('.commands .buttons button .cmd-text').forEach(text => $toggle(text, !(!Settings.eliminateByRules || solved === undefined || solved)))
  }

  function updateNumberCounts() {
    if(!Settings.countSolvedNumbers) return

    const counts = Array(Config.scale + 1).fill(0)
    state.cells.forEach(({value, solved}) => {
      if(solved) counts[Number(value)]++
    })

    for(let index=1; index<=Config.scale; index++) {
      $numberCounts[index].innerHTML = counts[index]
    }
  }

  function checkCorrectnessByRules(cell) {
    if(!Settings.checkCorrectnessByRules) return undefined
    if(!cell.solved) return undefined

    for(const [house, keys] of Grid.houses(cell.key)) {
      if(duplicates(cell, keys)) {
        Prompt.error(T('board.info.cell-duplicated-in-house', {
          cell: cell.key,
          value: cell.value,
          'house-type': T('board.house.' + house)
        }))
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
            Prompt.error(T('board.info.cell-duplicated-in-house', {
              cell: key,
              value,
              'house-type': T('board.house.' + singular(house))
            }))
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
    if(!Settings.eliminateByRules) return
    if(!state.focused) return

    const candidates = new Set(Cell.CANDIDATES)
    Grid.peers(state.focused).forEach(key => {
      const cell = state.cells.get(key)
      if(cell.solved) candidates.delete(cell.value)
    })

    const cell = state.cells.get(state.focused)
    cell.value = [...candidates]
    clearCrossHatching(cell)
    onValueChanged(cell)
  }

  function onMarkCrossHatching() {
    if(!Settings.markCrossHatching) return
    if(!state.focused) return

    const {value, solved} = state.cells.get(state.focused)
    if(!solved) return

    const sameValueBoxes = new Set()
    const sameValueColumns = new Set()
    const sameValueKeys = new Set()
    Grid.ROWS.forEach(rowId => {
      Grid.COLUMNS.filter(colId => !sameValueColumns.has(colId)).forEach(colId => {
        const key = Grid.keyOf(rowId, colId)
        const peer = state.cells.get(key)
        if(peer.value === value) {
          sameValueKeys.add(key)
          sameValueColumns.add(colId)
          sameValueBoxes.add(Grid.boxKeyOf(rowId, colId))
        }
      })
    })

    sameValueKeys.forEach(sameValueKey => {
      const houses = Grid.houses(sameValueKey)
      houses.delete('box')
      houses.forEach((keys, house) => {
        keys.filter(key => !sameValueBoxes.has(Grid.boxKeyOf(key))).forEach(key => {
          const peer = state.cells.get(key)
          if(!peer.solved) {
            $show($E('div.' + house, peer.div()))
          }
        })
      })
    })
  }

  function clearCrossHatching(cell) {
    if(!cell || cell.value !== '') {
      // Clear existing cross-hatching marks
      $A('div.grid div.cell > div.cross').forEach(div => $hide(div))
    }
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
      const {value, eliminated} = state.cells.get(key)
      const cell = new Cell(key, value, eliminated, cssClass) // Keep current value
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

  function snapshot() {
    const result = {...state}
    result.cells = Object.fromEntries(state.cells)
    return result
  }

  function restore(_state) {
    if(Object.isEmpty(_state) || Object.isEmpty(_state.cells)) return Promise.resolve()

    Object.assign(state, _state)
    state.cells = new Map(Object.entries(state.cells))
    state.cells.forEach((cell, key) => {
      state.cells.set(key, Cell.from(cell))
    })

    return onRerender()
  }

  function onRerender() {
    const {focused} = state
    return render()
      .then(() => { if(focused) onFocus(focused) })
  }

  return {
    init,
    load,
    reload,
    restore,
    snapshot,
  }
})()
