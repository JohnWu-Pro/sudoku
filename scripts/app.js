'use strict';

const APP_ID = 'sudoku'

const APP_VERSION = '1.1.0'

window.App = window.App ?? (() => {

  function launch() {
    document.title = T('app.name')

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

    return Game.init()
      .then(() => Game.startup())
      .then(() => appendFooter())
      .then(() => appendElement('div', {className: 'overlay hidden'}))
  }

  function onActivate() {
    Game.resume()
  }

  function onDeactivate() {
    Game.pause()
  }

  function appendFooter() {
    appendElement('div', {className: 'footer'}).innerHTML = /*html*/`
      <span class="no-wrap"><a href="javascript:openMarkdown('${T('footer.license')}', '${CONTEXT_PATH}/LICENSE.md')">${T('footer.copyright')} &copy; 2022-${(new Date().getFullYear())}</a></span>
      <span class="no-wrap"><a href="mailto: johnwu.pro@gmail.com" target="_blank">${T('footer.owner')}</a>,</span>
      <span class="no-wrap">${T('footer.licensed-under')} <a href="https://mozilla.org/MPL/2.0/" target="_blank">MPL-2.0</a>.</span>
    `
  }

  //
  // Initialize
  //
  document.addEventListener("DOMContentLoaded", () => {
    delay(1) // Yield to other DOMContentLoaded handlers
      .then(launch)
      .then(() => console.info("[INFO] Launched Sudoku App."))
      .catch(error => console.error("[ERROR] Error occurred: %o", error))
  })

})()
