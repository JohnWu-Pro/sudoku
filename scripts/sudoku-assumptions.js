'use strict';

class Assumption {

  static ACCEPTED = new Assumption('ACCEPTED', '')
  static #CSS_CLASSES = ['if-1st', 'if-2nd', 'if-3rd']

  static #availableCssClasses = [...Assumption.#CSS_CLASSES]
  static #nextCssClass() {
    return Assumption.#availableCssClasses.shift()
  }
  static #releaseCssClass(cssClass) {
    return Assumption.#availableCssClasses.push(cssClass)
  }
  static allowMore() {
    return Assumption.#availableCssClasses.length > 0
  }

  #id
  #name
  #cssClass
  #snapshots // array of {key: string, value: number | number[]}

  constructor(name, cssClass) {
    this.#id = Date.now().toString()
    this.#name = name
    this.#cssClass = cssClass ?? Assumption.#nextCssClass()
    this.#snapshots = []
  }

  get id() { return this.#id }
  get name() { return this.#name }
  get cssClass() { return this.#cssClass }
  get snapshots() { return [...this.#snapshots] }

  push(cell) {
    const {key, value} = cell
    // console.debug("[DEBUG] Push snapshot %o into assumption(%o) ...", {key, value}, {id: this.#id, name: this.#name})
    this.#snapshots.push({key, value})
  }

  accept() {
    Assumption.#releaseCssClass(this.#cssClass)
  }

  reject() {
    Assumption.#releaseCssClass(this.#cssClass)
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

  function accept(id) { // accept the assumption and its predecessor(s)
    // console.debug("[DEBUG] Calling accept(%s), assumptions: %o ...", id, [...assumptions])

    const keys = new Set()

    let assumption = null
    do {
      assumption = shift()
      if(!assumption) throw Error(`Invalid assumption id: '${id}'.`)

      for(const cell of assumption.snapshots) {
        Assumption.ACCEPTED.push(cell)
        keys.add(cell.key)
      }
      assumption.accept()
    } while(assumption.id !== id)

    for(assumption of assumptions) {
      for(const {key} of assumption.snapshots) {
        keys.delete(key)
      }
    }

    // [cssClass: cell-keys-that-need-to-be-re-rendered]
    return keys
  }

  function reject(id) { // reject the assumption and its successor(s)
    // console.debug("[DEBUG] Calling reject(%s), assumptions: %o ...", id, [...assumptions])

    const affected = new Map() // [cssClass: cells-that-need-to-be-re-rendered]

    let assumption = null
    do {
      assumption = pop()
      if(!assumption) throw Error(`Invalid assumption id: '${id}'.`)

      const cells = []
      for(const {key, value} of assumption.snapshots.reverse()) {
        cells.push(new Cell(key, value))
      }
      affected.set(peek().cssClass, cells)
      assumption.reject()
    } while(assumption.id !== id)

    return affected
  }

  function renderOptionsFor(cell) {
    const div = $E('div.assumptions > div.tentative')
    if(!cell || cell.settled) {
      div.innerHTML = ''
      return
    }
    if(!Assumption.allowMore()) {
      div.innerHTML = ''
      $E('div.message').innerHTML = 'Too many assumptions!' // TODO
      return
    }

    const candidates = [...cell.candidates]
    if(candidates.length === 0) candidates.push(...Cell.CANDIDATES)

    div.innerHTML = `
      <select>${candidates.reduce((html, candidate) => html +
        `<option value="assume ${cell.key} is ${candidate}">Assume ${cell.key} is ${candidate}</option>`,
        `<option value="">Assume ${cell.key} is ...</option>`)}
      </select>
    `
    // attach event handler to start assumption
    $E('select', div).addEventListener('change', onStart)
  }

  function onStart(event) {
    const option = firstOf(event.target.selectedOptions)
    const [matched, key, value] = option?.value?.match(/^assume ([A-Z]\d+) is (\d+)$/) ?? []
    if(!matched) return

    push(new Assumption(option.text))
    // console.debug("Started %o, assumptions: %o", peek(), [...assumptions])

    // trigger synthetic event to update the grid
    window.dispatchEvent(new CustomEvent('assumption-started', {
      detail: {key, value: Number(value)}
    }))

    render()
  }

  function render() {
    const div = $E('div.assumptions > div.pending')

    const max = assumptions.length - 1
    div.innerHTML = assumptions.reduce((html, assumption, index) => html + `
      <div class="assumption ${assumption.cssClass}">
        <span>${assumption.name}:</span>
        <button data-id="${assumption.id}" data-action="accept">${index===0 ? 'Accept &nbsp;' : 'Accept ⭳'}</button>
        <button data-id="${assumption.id}" data-action="reject">${index===max ? 'Reject &nbsp;' : 'Reject ↧'}</button>
      </div>
      `, '')

    // attach event handler
    $A('.assumption > button', div).forEach((button) => {
      button.addEventListener('click', onEnd)
    })
  }

  function onEnd(event) {
    const dataset = event.target.dataset
    const id = dataset.id
    const action = dataset.action

    // accept or reject
    const affected = action === 'accept' ? accept(id) : reject(id)

    // trigger synthetic event to update the grid
    window.dispatchEvent(new CustomEvent(`assumption-${action}ed`, {
      detail: {affected}
    }))

    render()
  }

  //
  // Initialize
  //
  setCellTracer()

  return {
    peek,
    renderOptionsFor
  }
})()
