'use strict';

class Cell {
  static CANDIDATES = new Set(Array(CONFIG.scale).fill(0).map((_, i) => 1+i))
  static tracer

  #key
  #value // single value (0, or 1..max), or values array
  #status // pending | seed | settled
  #changed = false // whether value is changed in the latest value assignment

  constructor(key, val, status) {
    this.#key = key
    this.#value = Cell.#normalize(val)
    this.#status = this.settled ? (status === 'seed' ? 'seed' : 'settled') : 'pending'
  }

  get key() {
    return this.#key
  }

  get value() {
    return this.#value
  }
  set value(val) {
    if(this.#status === 'seed') return

    val = Cell.#normalize(val)
    this.#changed = !Cell.#isEqual(val, this.#value)
    if(!this.#changed) return

    Cell.tracer.push(this)

    this.#value = val
    this.#status = this.settled ? 'settled' : 'pending'
  }
  get changed() {
    return this.#changed
  }

  get candidates() {
    const array = Array.isArray(this.#value) ? this.#value : (this.#value ? [this.#value] : [])
    return new Set(array)
  }

  get settled() { // single value in 1..max
    return Array.isArray(this.#value) ? false : this.#value !== 0
  }

  focus(on) {
    this.div().classList.toggle('focused', on)
  }

  render(decoration) {
    let text = Array.isArray(this.#value) ? this.#value.join('') : (this.#value || '')
    if(text.length > 4) text = '...'

    if(this.#value === 0) decoration = '', text = '&nbsp;'

    this.div().innerHTML =
      `<div class="value ${this.#status} ${decoration ?? ''}">${text}</div>`
  }

  div() {
    return $E('div.cell-' + this.#key)
  }

  static #normalize(val) {
    if(! val) {
      return 0
    } else if(Array.isArray(val)) {
      return val.length === 0 ? 0 : (val.length === 1 ? Cell.#norm(val[0]) : val.sort())
    } else {
      return Cell.#norm(val)
    }
  }

  static #norm(val) {
    return (0 < val && val <= CONFIG.scale) ? val : 0
  }

  static #isEqual(val1, val2) {
    if(Array.isArray(val1) && Array.isArray(val2)) {
      if(val1.length !== val2.length) return false

      for(let i=0; i<val1.length; i++) {
        if(val1[i] !== val2[i]) return false
      }
      return true
    } else {
      return val1 === val2
    }
  }
}
