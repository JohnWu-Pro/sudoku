'use strict';

class Cell {
  static CANDIDATES = new Set(Array(Config.scale).fill(0).map((_, i) => '123456789'.charAt(i)))
  static tracer

  #key
  #value // single value ('', or '1'..'9'), or string of '1'..'9' (sorted)
  #cssClass // CSS decoration class when rendering the value
  #status // pending | given | solved

  constructor(key, val, cssClass, status) {
    this.#key = key
    this.#value = Cell.#normalize(val)
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

  get cssClass() { return this.#cssClass }

  get candidates() {
    return new Set(this.#value.split(''))
  }

  get solved() { // single-char of '1'..'9'
    return Cell.CANDIDATES.has(this.#value)
  }

  focus(on) {
    this.div().classList.toggle('focused', on)
  }

  render() {
    const text = this.#value === '' ? '&nbsp;' : this.#value.length <= 4 ? this.#value : '...'
    const decoration = this.#value === '' ? '' : this.#cssClass

    this.div().innerHTML = `
      <div class="value ${this.#status} ${decoration}">${text}</div>
      <div class="cross row hidden"></div>
      <div class="cross column hidden"></div>
    `
  }

  div() {
    return $E('div.cell-' + this.#key)
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
