'use strict';

class Settings {
  static startupFallback = 'start-Easy'

  static DEFAULT = Object.freeze({
    // resume | start-Easy | start-Medium | start-Hard | start-Expert | start-Manual
    onStartup: 'resume',

    allowUndo: true,
    checkCorrectnessByRules: true,
    countSolvedNumbers: true,
    eliminateByRules: true,
    highlightSolvedSameValue: true,
    markCrossHatching: true,
    markEliminated: true,
    traceAssumptions: true,
  })

  static #instance = Object.seal({...Settings.DEFAULT})
  static {
    State.load()
    .then((cache) => Object.assign(Settings.#instance, cache.settings ?? {}))
  }

  static get onStartup() { return Settings.#instance.onStartup }

  static get allowUndo() { return Settings.#instance.allowUndo }
  static get checkCorrectnessByRules() { return Settings.#instance.checkCorrectnessByRules }
  static get countSolvedNumbers() { return Settings.#instance.countSolvedNumbers }
  static get eliminateByRules() { return Settings.#instance.eliminateByRules }
  static get highlightSolvedSameValue() { return Settings.#instance.highlightSolvedSameValue }
  static get markCrossHatching() { return Settings.#instance.markCrossHatching }
  static get markEliminated() { return Settings.#instance.markEliminated }
  static get traceAssumptions() { return Settings.#instance.traceAssumptions }

  static update(settings) {
    Object.assign(Settings.#instance, settings)
    return State.set({settings: Settings.#instance})
  }

  static View = (() => {
    var initialized = false
    var $overlay, $div

    function init() {
      if(initialized) return

      $overlay = $E('div.overlay')
      $div = appendElement('div', {className: 'settings-view hidden'}, $overlay)
      $div.innerHTML = `
        <div class="settings-header">
          <span class="go-back"></span>
          <span class="title">Settings</span>
        </div>
        <div class="settings-content">
          <div>
            <label for="on-startup">On startup</label>
            <select id="on-startup" class="block border">
              <option value="resume">Continue where you left off</option>
              <option value="start-Easy">Start an Easy Sudoku</option>
              <option value="start-Medium">Start a Medium Sudoku</option>
              <option value="start-Hard">Start a Hard Sudoku</option>
              <option value="start-Expert">Start an Expert Sudoku</option>
              <option value="start-Manual">Start Manually Input Givens</option>
            </select>
          </div>
          <div>
            <label for="allow-undo">Allow Undo</label>
            <input id="allow-undo" type="checkbox" class="switch">
          </div>
          <div>
            <label for="check-correctness-by-rules">Check Correctness by Rules</label>
            <input id="check-correctness-by-rules" type="checkbox" class="switch">
          </div>
        </div>
      `
      $E('.go-back', $div).addEventListener('click', () => onGoBack())

      initialized = true
    }

    function show() {
      init()

      $A('select[id], input[id]', $div).forEach(input => {
        const prop = camelize(input.id)
        if(input.checked === undefined) {
          input.value = Settings[prop]
        } else {
          input.checked = Settings[prop]
        }
      })

      $show($div)
      $show($overlay)
    }

    function onGoBack() {
      const settings = {}

      $A('select[id], input[id]', $div).forEach(input => {
        const prop = camelize(input.id)
        if(input.checked === undefined) {
          settings[prop] = input.value
        } else {
          settings[prop] = input.checked
        }
      })

      console.debug("[DEBUG] Updating settings (%o) ...", settings)
      Settings.update(settings)

      $hide($overlay)
      $hide($div)
    }

    return { show }
  })()

}
