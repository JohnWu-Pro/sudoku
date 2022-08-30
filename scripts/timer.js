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
    this.#accumulated = 0
    this.#started = 0
    this.#status = 'stopped'

    this.#$element.classList.add(this.#status)
    this.#$element.addEventListener('click', () => this.#onClicked())
  }

  get elapsed() {
    return this.#accumulated + (this.#status === 'running' ? Date.now() - this.#started : 0)
  }

  start() {
    this.#_start(0)
  }

  resume(accumulated) {
    this.#_start(accumulated ?? this.#accumulated)
  }

  #_start(accumulated) {
    this.#setAccumulated(accumulated)
    this.#started = Date.now()
    this.#setStatus('running')
    this.#handle = setInterval(() => this.#tick(), 1000)
  }

  reset() {
    this.stop()
    this.start()
  }

  pause() {
    this.#_stop('paused')
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

  #onClicked() {
    switch (this.#status) {
      case 'stopped':
        // do-nothing
        break;
      case 'running':
        this.pause()
        break;
      case 'paused':
        this.resume()
        break;
      default:
    }
  }

  #tick() {
    this.#$element.innerHTML = Timer.format(this.#accumulated + Date.now() - this.#started)
  }

  #setAccumulated(value) {
    this.#accumulated = value
    this.#$element.innerHTML = Timer.format(this.#accumulated)
  }

  #setStatus(value) {
    this.#$element.classList.remove(this.#status)
    this.#status = value
    this.#$element.classList.add(this.#status)
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

    const dd = (n) => n < 10 ? '0' + n : n.toString()
    return `${h}:${dd(mm)}:${dd(ss)}`
  }
}