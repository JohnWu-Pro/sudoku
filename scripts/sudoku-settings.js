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
    var activatedVersion
    var initialized = false
    var $overlay, $div

    function init() {
      if(initialized) return

      $overlay = $E('div.overlay')
      $div = appendElement('div', {className: 'settings-view hidden'}, $overlay)
      $div.innerHTML = /*html*/`
        <div class="settings-header">
          <span class="go-back"></span>
          <span class="title">${T('settings.title')}</span>
        </div>
        <div class="settings-content">
          <div class="level-1">
            <label for="on-startup">${T('settings.on-startup')}:</label>
            <select id="on-startup">` +
      STARTUP_OPTIONS.reduce((html, value) => html + /*html*/`
              <option value="${value}">${T('settings.on-startup.' + value)}</option>`, '') + /*html*/`
            </select>
          </div>
          <div class="level-1">
            <label for="auxiliary-features">${T('settings.auxiliary-features')}:</label>
            <select id="auxiliary-features">` +
      AUXILIARY_OPTIONS.reduce((html, value) => html + /*html*/`
              <option value="${value}">${T('settings.auxiliary-features.' + value)}</option>`, '') + /*html*/`
            </select>
          </div>` +
      ALL_FEATURES.map(prop => hyphenize(prop)).reduce((html, key) => html + /*html*/`
          <div class="level-2">
            <label for="${key}">${T('settings.switch.' + key)}</label>
            <input id="${key}" type="checkbox" class="switch">
          </div>`, '') + /*html*/`
        </div>
        <div class="settings-footer">
          <div class="share">
            <div class="label">
              <span>${T('settings.share')}:</span>
              <input type="checkbox" checked id="including-current-givens" name="including-current-givens"><label for="including-current-givens">${T('settings.share.including-current-givens')}</label>
            </div>
            <div class="input">
              <div class="qrcode"></div>
            </div>
          </div>
          <div class="app no-wrap">
            <a href="javascript:openMarkdown('${T('app.name')}', '${CONTEXT_PATH}/README.md')">${T('app.name')}</a>
            <span>${APP_VERSION}</span>
            ${renderUpgrade()}
          </div>
        </div>
      `
      $E('#auxiliary-features', $div).addEventListener('change', onChangeFeatures)
      $E('.go-back', $div).addEventListener('click', onGoBack)

      const includingGivens = $E('.share input[name="including-current-givens"]', $div)
      const container = $E('div.qrcode', $div)

      function renderQrcode() {
        const url = new URL(location.href)
        url.search = ''
        url.hash = ''
        url.searchParams.set('v', new Date().toISOString().replace(/^(\d{4})-(\d{2})-(\d{2}).{10}(\d{3}).+$/, '$1$2$3$4'))
        if(includingGivens.checked) {
          const givens = Givens.format(Board.snapshot().givens)

          url.searchParams.set('givens', givens)
        }
        const text = url.href
        // console.debug("QR code text(length: %o): %s", text.length, text)

        container.innerHTML = ''
        new QRCode(container, {
          text,
          width: 144,
          height: 144,
          quietZone: 8,
          quietZoneColor: '#C0FFC0',
          logo: HREF_BASE + '/../images/icon-64x64.png',
          logoWidth: 64,
          logoHeight: 64,
          logoBackgroundTransparent: true,
        })
      }
      Promise.resolve().then(renderQrcode)

      includingGivens.addEventListener('change', renderQrcode)

      function renderUpgrade() {
        return !(activatedVersion > APP_VERSION) ? ''
            : `<button id="upgrade">${T('app.upgrade')} ${activatedVersion}</button>`
      }
      $E('.app #upgrade')?.addEventListener('click', () => window.location.reload())

      navigator.serviceWorker?.addEventListener('message', (event) => {
        // console.debug("[DEBUG] Received Service Worker message: %s", JSON.stringify(event.data))
        if(event.data.type === 'SW_ACTIVATED') activatedVersion = event.data.version
      })

      initialized = true
    }

    function show() {
      init()

      $A('select[id], input[id]', $E('.settings-content', $div)).forEach(input => {
        input[input.checked === undefined ? 'value' : 'checked'] = Settings[camelize(input.id)]
      })
      onChangeFeatures({target: {value: Settings.auxiliaryFeatures}})

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
      var last = null
      $A('input[id]', $E('.settings-content', $div)).forEach(input => {
        input.parentElement.classList.remove('last')
        const prop = camelize(input.id)
        $toggle(input.parentElement, !features.has(prop))
        if(features.has(prop)) last = input
      })
      last.parentElement.classList.add('last')
    }

    function close() {
      const settings = {}

      const features = FEATURES[$E('select#auxiliary-features').value]
      $A('select[id], input[id]', $E('.settings-content', $div)).forEach(input => {
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
