'use strict';

class Cell {
  static CANDIDATES = Object.freeze(new Set(Array(Config.scale).fill(0).map((_, i) => '123456789'.at(i))))
  static tracer

  #key
  #value      // single value ('', or '1'..'9'), or string of '1'..'9' (sorted)
  #eliminated // single value ('', or '1'..'9'), or string of '1'..'9' (sorted)
  #cssClass   // decoration CSS class when rendering the cell
  #status     // given | pending | solved

  constructor(key, value, eliminated, cssClass, status) {
    this.#key = key
    this.#value = Cell.#normalize(value)
    this.#eliminated = Cell.#normalize(eliminated)
    this.#cssClass = cssClass ?? Cell.tracer.cssClass
    this.#status = this.solved ? (status === 'given' ? 'given' : 'solved') : 'pending'
  }

  get key() { return this.#key }

  get value() { return this.#value }
  set value(val) { // accept '', single-char string, multi-char string, or array (of single-char string)
    if(this.#status === 'given') return

    val = Cell.#normalize(val)
    if(val === this.#value) return

    Cell.tracer.push(this)

    this.#value = val
    this.#cssClass = Cell.tracer.cssClass
    this.#status = this.solved ? 'solved' : 'pending'
  }
  get candidates() {
    return new Set(this.#value.split(''))
  }

  get eliminated() { return this.#eliminated }
  set eliminated(val) { // accept '', single-char string, multi-char string, or array (of single-char string)
    if(this.#status === 'given') return

    val = Cell.#normalize(val)
    if(val === this.#eliminated) return

    Cell.tracer.push(this)

    this.#eliminated = val
    this.#cssClass = Cell.tracer.cssClass
  }
  get eliminations() {
    return new Set(this.#eliminated.split(''))
  }

  get cssClass() { return this.#cssClass }

  get solved() { // single-char of '1'..'9'
    return Cell.CANDIDATES.has(this.#value)
  }

  focus(on) {
    this.div().classList.toggle('focused', on)
  }

  render() {
    const value = this.#value === '' ? '&nbsp;' : this.#value.length <= 4 ? this.#value : '...'
    const eliminated = this.solved ? '' : this.#eliminated.length <= 4 ? this.#eliminated : '...'
    const decoration = this.#value === '' && this.#eliminated === '' ? '' : this.#cssClass

    this.div().innerHTML = `
      <div class="value ${this.#status} ${decoration}">${value}</div>
      <div class="eliminated">${eliminated}</div>
      <div class="cross row hidden"></div>
      <div class="cross column hidden"></div>
    `
  }

  div() {
    return $E('div.cell-' + this.#key)
  }

  toJSON() {
    const {key, value, eliminated, cssClass} = this
    return {key, value, eliminated, cssClass, status: this.#status}
  }

  static from(object) {
    const {key, value, eliminated, cssClass, status} = object
    return new Cell(key, value, eliminated, cssClass, status)
  }

  static #normalize(val) {
    if(! val) {
      return ''
    } else if(Array.isArray(val)) {
      return val.length === 0 ? '' : (val.length === 1 ? Cell.#norm(val[0]) : val.sort().join(''))
    } else if(val.length > 1) { // multi-char string
      return val.split('').sort().join('')
    } else {
      return Cell.#norm(val)
    }
  }

  static #norm(val) {
    val = String(val)
    return Cell.CANDIDATES.has(val) ? val : ''
  }
}
