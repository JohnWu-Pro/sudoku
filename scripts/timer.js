'use strict';

/**
 * A timer that can only be started and stopped externally,
 * and pause/resume are handled by itself by clicking the element.
 */
class Timer {

  #$element
  #handle

  #accumulated // milliseconds since start, till the latest resume
  #started     // the millisecond (UNIX epoch) of the latest start/resume

  #status      // stopped | running | paused

  constructor(selector) {
    this.#$element = $E(selector)
    this.#handle = 0
    this.#setAccumulated(0)
    this.#started = 0
    this.#setStatus('stopped')
  }

  get elapsed() {
    return this.#accumulated + (this.#status === 'running' ? Date.now() - this.#started : 0)
  }

  get status() { return this.#status }

  start() {
    this.#_start(0)
  }

  resume() {
    if(this.#status === 'paused') this.#_start(this.#accumulated)
  }

  #_start(accumulated) {
    if(this.#handle !== 0) clearInterval(this.#handle)

    this.#setAccumulated(accumulated)
    this.#started = Date.now()
    this.#setStatus('running')
    this.#handle = setInterval(() => this.#tick(), 1000)
  }

  pause() {
    if(this.#status === 'running') this.#_stop('paused')
  }

  stop() {
    this.#_stop('stopped')
  }

  #_stop(status) {
    if(this.#handle === 0) return

    this.#setAccumulated(this.#accumulated + Date.now() - this.#started)
    this.#setStatus(status)

    clearInterval(this.#handle)
    this.#handle = 0
  }

  reset() {
    this.stop()
    this.#setAccumulated(0)
  }

  snapshot() {
    const {elapsed, status} = this
    return {elapsed, status}
  }

  restore(state) {
    const {elapsed, status} = state
    if(status === 'running') {
      this.#_start(elapsed)
    } else {
      this.#setAccumulated(elapsed)
    }
    this.#setStatus(status)
  }

  #tick() {
    this.#$element.innerHTML = Timer.format(this.#accumulated + Date.now() - this.#started)
  }

  #setAccumulated(value) {
    this.#accumulated = value
    this.#$element.innerHTML = Timer.format(value)
  }

  #setStatus(value) {
    // this.#$element.classList.remove(this.#status)
    this.#status = value
    // this.#$element.classList.add(this.#status)
  }

  static format(millis) {
    const mod = (n, d) => {
      let value = Math.floor(n/d)
      let rem = n - value * d
      return {value, rem}
    }

    let {value:  h, rem: _hour} = mod(millis, 3600000)
    let {value: mm, rem: _min} = mod(_hour, 60000)
    let {value: ss, rem: _sec} = mod(_min, 1000)

    const dd = (n) => n < 10 ? '0' + n : String(n)
    return `${h}:${dd(mm)}:${dd(ss)}`
  }
}
