'use strict';

class Assumption {

  static CSS_CLASSES = ['if-1st', 'if-2nd', 'if-3rd']
  static VOID = null

  static #availableCssClasses = [...Assumption.CSS_CLASSES]
  static #nextCssClass() {
    return Assumption.#availableCssClasses.shift()
  }
  static #releaseCssClass(cssClass) {
    return Assumption.#availableCssClasses.unshift(cssClass)
  }
  static allowMore() {
    return Assumption.#availableCssClasses.length > 0
  }

  #id
  #name
  #cssClass
  // #status // Pending | Accepted | Rejected
  #snapshots // array of {key: string, value: number | number[]}

  constructor(name) {
    this.#id = Date.now()
    this.#name = name
    this.#cssClass = Assumption.#nextCssClass()
    // this.#status = 'Pending'
    this.#snapshots = []
  }

  get id() { return this.#id }
  get name() { return this.#name }
  get cssClass() { return this.#cssClass }
  // get status() { return this.#status }

  push(cell) {
    const {key, value} = cell
    this.#snapshots.push({key, value})
  }

  pop() {
    const {key, value} = (this.#snapshots.pop() ?? {})
    return key ? new Cell(key, value) : null
  }

  accept() {
    Assumption.#releaseCssClass(this.#cssClass)
    // this.#status = 'Accepted'
  }

  reject() {
    Assumption.#releaseCssClass(this.#cssClass)
    // this.#status = 'Rejected'
  }

  static {
    Assumption.VOID = new Assumption('void')
    Assumption.VOID.accept()
    Assumption.VOID.#cssClass = ''
  }
}

window.Assumptions = window.Assumptions ?? (() => {
  const assumptions = []

  function setCellTracer() {
    Cell.tracer = peek()
  }

  // function findById(id) {
  //   for(const assumption of assumptions) {
  //     if(assumption.id === id) return assumption
  //   }
  //   return null
  // }

  function push(assumption) {
    assumptions.push(assumption)
    setCellTracer()
  }

  function pop() {
    const result = assumptions.pop()
    setCellTracer()
    return result
  }

  function peek() {
    return assumptions.length === 0 ? Assumption.VOID : assumptions[assumptions.length-1]
  }

  function accept(assumptionId) { // accept the assumption and its predecessor(s)
    // returns cells which need to be re-rendered
  }

  function reject(assumptionId) { // reject the assumption and its successor(s)
    // returns cells which need to be re-rendered
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
    const [_, key, value] = option?.value?.match(/^assume ([A-Z]\d) is (\d)$/) ?? []
    if(!key) return

    push(new Assumption(option.text))

    // trigger synthetic event to update the grid
    window.dispatchEvent(new CustomEvent('assumption-started', {
      detail: {key, value}
    }))

    render()
  }

  function render() {
    const div = $E('div.assumptions > div.pending')
    if(assumptions.length === 0) {
      div.innerHTML = ''
      return
    }

    div.innerHTML = assumptions.reduce((html, assumption) => html + `
      <div class="assumption ${assumption.cssClass}">
        <span>${assumption.name}:</span>
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
    const id = dataset.id
    const action = dataset.action

    console.debug("[DEBUG] Going to %s assumption(id: %s) ...", action, id)

    // accept or reject
    const decorations = action === 'accept' ? accept(id) : reject(id)

    // trigger synthetic event to update the grid
    window.dispatchEvent(new CustomEvent(`assumption-${action}ed`, {
      detail: {decorations}
    }))

    render()
  }

  function accept(id) { // returns [decoration: cells]
    const decorations = new Map()

    return decorations
  }

  function reject(id) { // returns [decoration: cells]
    const decorations = new Map()

    return decorations
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
