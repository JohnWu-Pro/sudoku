'use strict';

window.App = window.App ?? ((currentScript) => {

  const DEFAULT_FONT_FAMILIES = {
    en: 'New Times Roman',
    zh: '宋体'
  }

  function run() {
    document.title = T('document.title')

    $E('div.footer').innerHTML = `
      <a href="javascript:openDoc('LICENSE.txt', 'License')" title="License">${T('footer.copyright')} &copy; 2022</a>
      <a href="mailto: johnwu.pro@gmail.com" target="_blank">${T('footer.owner')}</a>,
      ${T('footer.licensed-under')} <a href="https://mozilla.org/MPL/2.0/" target="_blank">MPL-2.0</a>.
    `

    document.addEventListener("visibilitychange", () => {
      if(document.visibilityState === 'visible') {
        onActivate()
      } else {
        onDeactivate()
      }
    })
    window.addEventListener('beforeunload', (event) => {
      // console.debug("[DEBUG] About to unload the page ...")
      onDeactivate()
    })

    // Clear location - remove hash if exists
    const {pathname, search, hash} = window.location
    if(hash) history.replaceState(null, document.title, pathname + search)

    Game.init()
    .then(() => Game.startup())
  }

  function onActivate() {
    Game.resume()
  }

  function onDeactivate() {
    Game.pause()
  }

  function resolveLocale() {
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

  function resolveDynamicScripts(definedQualifiers, version) {
    const locale = resolveLocale()
    const lang = locale.substring(0, 2)

    const qualifiers = []
    for(const qualifier of [lang, locale]) {
      if(definedQualifiers.includes(qualifier)) qualifiers.push(qualifier)
    }
    // console.debug("[DEBUG] Resolved qualifiers: %o", qualifiers)

    const scripts = qualifiers.map(qualifier => `${HREF_BASE}/scripts/i18n.resources.${qualifier}.js?${version}`)
    // console.debug("[DEBUG] Resolved dynamic scripts: %o", scripts)
    return scripts
  }

  //
  // Initialize
  //
  document.addEventListener("DOMContentLoaded", () => {
    loadResources(
      ...resolveDynamicScripts(Config.definedQualifiers, versionOf(currentScript))
    ).then(() => {
      window.T = i18n

      const lang = resolveLocale().substring(0, 2)
      $E(':root').style.setProperty('--default-font-family', DEFAULT_FONT_FAMILIES[lang])

      run()
      console.info("[INFO] Launched Sudoku App.")
    }).catch(error => {
      console.error("[ERROR] Error occurred: %o", error)
    })
  })

})(document.currentScript)
