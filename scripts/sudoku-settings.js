'use strict';

class Settings {
  static startupFallback = 'start-Easy'

  static DEFAULT = Object.freeze({
    // resume | start-Easy | start-Medium | start-Hard | start-Expert | start-Manual
    onStartup: 'resume',

    // more | less | minimum
    auxiliaryFeatures: 'more',

    allowUndo: true,
    checkCorrectnessByRules: true,
    countSolvedNumbers: true,
    eliminateByRules: true,
    highlightSolvedSameValue: true,
    markCrossHatching: true,
    supportMarkingEliminated: true,
    traceAssumptions: true,
  })

  static #instance = Object.seal({...Settings.DEFAULT})
  static {
    State.load()
    .then((cache) => Object.assign(Settings.#instance, cache.settings ?? {}))
  }

  static get onStartup() { return Settings.#instance.onStartup }
  static get auxiliaryFeatures() { return Settings.#instance.auxiliaryFeatures }

  static get allowUndo() { return Settings.#instance.allowUndo }
  static get checkCorrectnessByRules() { return Settings.#instance.checkCorrectnessByRules }
  static get countSolvedNumbers() { return Settings.#instance.countSolvedNumbers }
  static get eliminateByRules() { return Settings.#instance.eliminateByRules }
  static get highlightSolvedSameValue() { return Settings.#instance.highlightSolvedSameValue }
  static get markCrossHatching() { return Settings.#instance.markCrossHatching }
  static get supportMarkingEliminated() { return Settings.#instance.supportMarkingEliminated }
  static get traceAssumptions() { return Settings.#instance.traceAssumptions }

  static update(settings) {
    Object.assign(Settings.#instance, settings)
    return State.set({settings: Settings.#instance})
  }

  static View = (() => {
    const FEATURES = {
      'more': new Set([
        'allowUndo',
        'checkCorrectnessByRules',
        'countSolvedNumbers',
        'eliminateByRules',
        'highlightSolvedSameValue',
        'markCrossHatching',
        'supportMarkingEliminated',
        'traceAssumptions',
      ]),
      'less': new Set([
        'allowUndo',
        'checkCorrectnessByRules',
        'countSolvedNumbers',
        'highlightSolvedSameValue',
        'supportMarkingEliminated',
      ]),
      'minimum': new Set([
        'supportMarkingEliminated',
      ]),
    }
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
          <div class="level-1">
            <label for="on-startup">On startup:</label>
            <select id="on-startup">
              <option value="resume">Continue where you left off</option>
              <option value="start-Easy">Start an Easy Sudoku</option>
              <option value="start-Medium">Start a Medium Sudoku</option>
              <option value="start-Hard">Start a Hard Sudoku</option>
              <option value="start-Expert">Start an Expert Sudoku</option>
              <option value="start-Manual">Start Manually Input Givens</option>
            </select>
          </div>
          <div class="level-1">
            <label for="auxiliary-features">Auxiliary features:</label>
            <select id="auxiliary-features">
              <option value="more">More (Easier to Play)</option>
              <option value="less">Less (More Difficult to Play)</option>
              <option value="minimum">Minimum (Challenging)</option>
            </select>
          </div>
          <div class="level-2">
            <label for="allow-undo">Allow Undo</label>
            <input id="allow-undo" type="checkbox" class="switch">
          </div>
          <div class="level-2">
            <label for="check-correctness-by-rules">Check Correctness by Rules</label>
            <input id="check-correctness-by-rules" type="checkbox" class="switch">
          </div>
          <div class="level-2">
            <label for="count-solved-numbers">Count Solved Numbers</label>
            <input id="count-solved-numbers" type="checkbox" class="switch">
          </div>
          <div class="level-2">
            <label for="eliminate-by-rules">Eliminate by Row, Column, and Box</label>
            <input id="eliminate-by-rules" type="checkbox" class="switch">
          </div>
          <div class="level-2">
            <label for="highlight-solved-same-value">Highlight Solved Same Value</label>
            <input id="highlight-solved-same-value" type="checkbox" class="switch">
          </div>
          <div class="level-2">
            <label for="mark-cross-hatching">Mark Cross-Hatching</label>
            <input id="mark-cross-hatching" type="checkbox" class="switch">
          </div>
          <div class="level-2">
            <label for="support-marking-eliminated">Support Marking Eliminated</label>
            <input id="support-marking-eliminated" type="checkbox" class="switch">
          </div>
          <div class="level-2">
            <label for="trace-assumptions">Trace Assumptions</label>
            <input id="trace-assumptions" type="checkbox" class="switch">
          </div>
        </div>
      `
      $E('#auxiliary-features', $div).addEventListener('change', onChangeFeatures)
      $E('.go-back', $div).addEventListener('click', () => history.back())

      initialized = true
    }

    function show() {
      init()

      const features = FEATURES[Settings.auxiliaryFeatures]
      $A('select[id], input[id]', $div).forEach(input => {
        const prop = camelize(input.id)
        if(input.checked === undefined) {
          input.value = Settings[prop]
        } else {
          input.checked = Settings[prop]
          $toggle(input.parentElement, !features.has(prop))
        }
      })

      $show($div)
      $show($overlay)
      window.dispatchEvent(new CustomEvent('overlay-rendered'))

      // Push new location
      const {pathname, search} = window.location
      window.location = pathname + search + '#settings'

      // Listen to popstate event
      window.addEventListener('popstate', onPopState)
    }

    function onPopState() {
      window.removeEventListener('popstate', onPopState)
      close()
    }

    function onChangeFeatures(event) {
      const features = FEATURES[event.target.value]
      $A('input[id]', $div).forEach(input => {
        const prop = camelize(input.id)
        $toggle(input.parentElement, !features.has(prop))
      })
    }

    function close() {
      const settings = {}

      const features = FEATURES[$E('select#auxiliary-features').value]
      $A('select[id], input[id]', $div).forEach(input => {
        const prop = camelize(input.id)
        if(input.checked === undefined) {
          settings[prop] = input.value
        } else {
          settings[prop] = features.has(prop) && input.checked
        }
      })

      // console.debug("[DEBUG] Updating settings (%o) ...", settings)
      Settings.update(settings)

      $hide($overlay)
      $hide($div)
      window.dispatchEvent(new CustomEvent('overlay-closed'))
    }

    return { show }
  })()

}
