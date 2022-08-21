'use strict';

class App {

  static init() {
    // console.debug("[DEBUG] Calling App.init() ...")

    Sudoku.init()
    Sudoku.seed(Seed.get('Medium'))
    Sudoku.show()
  }

  static locale() {
    if(typeof State !== 'undefined') {
      // This is needed bacause of a Chrome defect.
      // The result of window.navigator.language is incorrect when running an installed PWA.
      const locale = State.get('installationTimeLocale')
      if(locale) {
        // console.trace("[TRACE] Returning cached installationTimeLocale: %s", locale)
        return locale
      } else {
        // console.debug("[DEBUG] No cached installationTimeLocale is available yet.")
      }
    }

    const locale = resolveNavigatorLocale()
    // console.trace("[TRACE] Returning resolved navigator locale: %s", locale)
    return locale
  }

  static #resolveDynamicScripts(definedQualifiers, version) {
    const locale = App.locale()
    const offset = timezoneOffset()

    const qualifiers = []
    for(const qualifier of [locale, 'UTC'+offset, `${locale}.UTC${offset}`]) {
      if(definedQualifiers.includes(qualifier)) qualifiers.push(qualifier)
    }
    // console.debug("[DEBUG] Resolved qualifiers: %o", qualifiers);

    const scripts = qualifiers.map(qualifier => `${HREF_BASE}/scripts/i18n.resources.${qualifier}.js?${version}`);
    // console.debug("[DEBUG] Resolved dynamic scripts: %o", scripts);
    return scripts
  }

}

App.currentScript = document.currentScript

document.addEventListener("DOMContentLoaded", App.init)
