'use strict';

class Assumption {

  static ACCEPTED = new Assumption('Xn', undefined, '')
  static #CSS_CLASSES = ['if-3rd', 'if-2nd', 'if-1st']

  static cssClasses = [...Assumption.#CSS_CLASSES]
  static #nextCssClass() {
    return Assumption.cssClasses.pop()
  }
  static #releaseCssClass(cssClass) {
    if(cssClass) Assumption.cssClasses.push(cssClass)
  }
  static allowMore() {
    return Assumption.cssClasses.length > 0
  }
  static reset() {
    Assumption.cssClasses = [...Assumption.#CSS_CLASSES]
  }

  #id
  #key        // the key of the cell for which the assumption is made
  #value      // the assumed value of the cell
  #cssClass   // the decoration CSS class to be used by the assumption target cell and changed cells subsequently
  #snapshots  // array of {key: string, value: string, cssClass: string}

  constructor(key, value, cssClass) {
    this.#id = Date.now().toString()
    this.#key = key
    this.#value = value
    this.#cssClass = cssClass === '' ? '' : Assumption.#nextCssClass()
    this.#snapshots = []
  }

  get id() { return this.#id }
  get key() { return this.#key }
  get value() { return this.#value }
  get cssClass() { return this.#cssClass }
  get snapshots() { return [...this.#snapshots] }

  push(cell) {
    const {key, value, cssClass} = cell
    this.#snapshots.push({key, value, cssClass})
  }

  pop() {
    return this.#snapshots.pop()
  }

  isEmpty() {
    return this.#snapshots.length === 0
  }

  accept() {
    Assumption.#releaseCssClass(this.#cssClass)
  }

  reject() {
    Assumption.#releaseCssClass(this.#cssClass)
  }

  toJSON() {
    const {id, key, value, cssClass, snapshots} = this
    return {id, key, value, cssClass, snapshots}
  }

  static from(object) {
    const {id, key, value, cssClass, snapshots} = object
    const result = new Assumption(key, value, '')
    result.#id = id
    result.#cssClass = cssClass
    result.#snapshots = snapshots
    return result
  }
}

window.Assumptions = window.Assumptions ?? (() => {
  const assumptions = []

  function setCellTracer() {
    Cell.tracer = peek()
  }

  function push(assumption) {
    assumptions.push(assumption)
    setCellTracer()
  }

  function pop() {
    const result = assumptions.pop()
    setCellTracer()
    return result
  }

  function shift() {
    const result = assumptions.shift()
    setCellTracer()
    return result
  }

  function peek() {
    return assumptions.length === 0 ? Assumption.ACCEPTED : assumptions[assumptions.length-1]
  }

  function clear() {
    assumptions.length = 0
    Assumption.reset()
    setCellTracer()
  }

  function snapshot() {
    return {
      ACCEPTED: Assumption.ACCEPTED,
      assumptions,
      cssClasses: Assumption.cssClasses
    }
  }

  function restore(state) {
    if(Object.isEmpty(state)) return Promise.resolve()

    if(!Object.isEmpty(state.ACCEPTED)) {
      Assumption.ACCEPTED = Assumption.from(state.ACCEPTED)
    }
    if(!Object.isEmpty(state.assumptions)) {
      Array.replace(assumptions, state.assumptions.map(it => Assumption.from(it)))
    }
    if(!Object.isEmpty(state.cssClasses)) {
      Array.replace(Assumption.cssClasses, state.cssClasses)
    }
    setCellTracer()

    return Promise.resolve()
  }

  function accept(id) { // accept the assumption and its predecessor(s)
    // console.debug("[DEBUG] Calling accept(%s), assumptions: %o ...", id, [...assumptions])

    const keys = new Set() // {key of cell-that-need-to-be-re-rendered}

    let assumption = null
    do {
      assumption = shift()
      if(!assumption) throw Error(`Invalid assumption id: '${id}'.`)

      const cssClass = Assumption.ACCEPTED.cssClass
      for(const {key, value} of assumption.snapshots) {
        keys.add(key)
        Assumption.ACCEPTED.push({key, value, cssClass})
      }
      assumption.accept()
    } while(assumption.id !== id)

    for(assumption of assumptions) {
      for(const {key} of assumption.snapshots) {
        keys.delete(key)
      }
    }

    return keys
  }

  function reject(id) { // reject the assumption and its successor(s)
    // console.debug("[DEBUG] Calling reject(%s), assumptions: %o ...", id, [...assumptions])

    const cells = [] // cells-that-need-to-be-re-rendered

    let assumption = null
    do {
      assumption = pop()
      if(!assumption) throw Error(`Invalid assumption id: '${id}'.`)

      for(const {key, value, cssClass} of assumption.snapshots.reverse()) {
        cells.push(new Cell(key, value, cssClass))
      }
      assumption.reject()
    } while(assumption.id !== id)

    return cells
  }

  function renderOptionsFor(cell) {
    const div = $E('div.assumptions > div.tentative')
    if(!Settings.traceAssumptions || !cell || cell.value === '' || cell.solved || !Assumption.allowMore()) {
      div.innerHTML = ''
      return
    }

    const candidates = [...cell.candidates]
    if(candidates.length === 0) candidates.push(...Cell.CANDIDATES)

    div.innerHTML = `
      <select class="block border">${candidates.reduce((html, candidate) => html +
        `<option value="assume ${cell.key} is ${candidate}">Assume ${cell.key} is ${candidate}</option>`,
        `<option value="">Assume ${cell.key} is ...</option>`)}
      </select>
    `
    // attach event handler to start assumption
    $E('select', div).addEventListener('change', onStart)
  }

  function onStart(event) {
    // const option = firstOf(event.target.selectedOptions)
    const [matched, key, value] = event.target.value.match(/^assume ([A-Z]\d+) is (\d+)$/) ?? []
    if(!matched) return

    push(new Assumption(key, value))
    // console.debug("[DEBUG] Started %o, assumptions: %o", peek(), [...assumptions])

    // trigger synthetic event to update the grid
    window.dispatchEvent(new CustomEvent('assumption-started', {
      detail: {key, value}
    }))

    render()

    if(!Assumption.allowMore()) warnNoMoreAssumption()
  }

  function render() {
    if(!Settings.traceAssumptions) return

    const div = $E('div.assumptions > div.pending')

    const max = assumptions.length - 1
    div.innerHTML = assumptions.reduce((html, assumption, index) => html + `
      <div class="assumption ${assumption.cssClass} border ${index===0 ? 'first' : ''} ${index===max ? 'last' : ''}">
        <span class="block">Assume ${assumption.key} is ${assumption.value}:</span>
        <button data-id="${assumption.id}" data-action="accept">Accept</button>
        <button data-id="${assumption.id}" data-action="reject">Reject</button>
      </div>
      `, '')

    // attach event handler
    $A('.assumption > button', div).forEach((button) => {
      button.addEventListener('click', onEnd)
    })
  }

  function onEnd(event) {
    const dataset = event.target.dataset
    trigger(dataset.action, dataset.id)
  }

  function trigger(action, id) {
    if(id === Assumption.ACCEPTED.id) return

    const index = assumptions.findIndex(it => it.id === id)
    const assumption = assumptions[index]
    const hasPredecessor = index > 0
    const hasSuccessor = index < assumptions.length - 1

    // accept or reject
    const affected = action === 'accept' ? accept(id) : reject(id)

    // trigger synthetic event to update the board
    window.dispatchEvent(new CustomEvent(`assumption-${action}ed`, {
      detail: {affected}
    }))

    render()

    if(action === 'accept') {
      Prompt.success(`Accepted '${assumption.key} is ${assumption.value}'`
        + (hasPredecessor ? ' and its predecessor(s).' : '.'))
    } else {
      Prompt.success(`Rejected '${assumption.key} is ${assumption.value}'`
        + (hasSuccessor ? ' and its successor(s).' : '.'))
    }
  }

  let warned = false
  function warnNoMoreAssumption() {
    if(warned) return

    Prompt.warn('Maximum 3 assumptions are supported!')
    warned = true
  }

  //
  // Initialize
  //
  setCellTracer()

  return {
    clear,
    peek,
    pop,
    push,
    render,
    renderOptionsFor,
    restore,
    snapshot,
    trigger,
  }
})()
