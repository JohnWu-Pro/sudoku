'use strict';

class Settings {
  static bootstrap = 'start-simple'

  static DEFAULT = Object.freeze({
    // resume | start-simple | start-easy | start-intermediate | start-expert | start-manual
    onStartup: 'resume',

    // more | less | least
    auxiliaryFeatures: 'more',

    allowUndo: true,
    checkCorrectnessByRules: true,
    countSolvedNumbers: true,
    eliminateByRules: true,
    highlightSolvedSameValue: true,
    markCrossHatching: true,
    markEliminated: false,
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
  static get markEliminated() { return Settings.#instance.markEliminated }
  static get traceAssumptions() { return Settings.#instance.traceAssumptions }

  static update(settings) {
    Object.assign(Settings.#instance, settings)
    return State.set({settings: Settings.#instance})
  }

  static View = (() => {
    const STARTUP_OPTIONS = [
      'resume',
      'start-simple',
      'start-easy',
      'start-intermediate',
      'start-expert',
      'start-manual',
    ]
    const AUXILIARY_OPTIONS = [
      'more',
      'less',
      'least',
    ]
    const ALL_FEATURES = [
      'allowUndo',
      'checkCorrectnessByRules',
      'countSolvedNumbers',
      'eliminateByRules',
      'highlightSolvedSameValue',
      'markCrossHatching',
      'markEliminated',
      'traceAssumptions',
    ]
    const FEATURES = {
      'more': new Set(ALL_FEATURES),
      'less': new Set([
        'allowUndo',
        'checkCorrectnessByRules',
        'countSolvedNumbers',
        'highlightSolvedSameValue',
        'markEliminated',
      ]),
      'least': new Set([
        'markEliminated',
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
          <span class="title">${T('settings.title')}</span>
        </div>
        <div class="settings-content">
          <div class="level-1">
            <label for="on-startup">${T('settings.on-startup')}:</label>
            <select id="on-startup">` +
      STARTUP_OPTIONS.reduce((html, value) => html + `
              <option value="${value}">${T('settings.on-startup.' + value)}</option>`, '') + `
            </select>
          </div>
          <div class="level-1">
            <label for="auxiliary-features">${T('settings.auxiliary-features')}:</label>
            <select id="auxiliary-features">` +
      AUXILIARY_OPTIONS.reduce((html, value) => html + `
              <option value="${value}">${T('settings.auxiliary-features.' + value)}</option>`, '') + `
            </select>
          </div>` +
      ALL_FEATURES.map(prop => hyphenize(prop)).reduce((html, key) => html + `
          <div class="level-2">
            <label for="${key}">${T('settings.switch.' + key)}</label>
            <input id="${key}" type="checkbox" class="switch">
          </div>`, '') + `
        </div>
      `
      $E('#auxiliary-features', $div).addEventListener('change', onChangeFeatures)
      $E('.go-back', $div).addEventListener('click', onGoBack)

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
      history.pushState(null, document.title, pathname + search + '#settings')

      // Listen to popstate event
      window.addEventListener('popstate', onPopState)
    }

    function onPopState() {
      window.removeEventListener('popstate', onPopState)
      close()
    }

    function onGoBack() {
      history.back()
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
