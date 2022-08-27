'use strict';

window.App = window.App ?? (() => {

  const currentScript = document.currentScript

  var $seeding = null

  function init() {
    // console.debug("[DEBUG] Calling App.init() ...")

    Sudoku.init()
    Sudoku.seed(Seed.EMPTY)
    Sudoku.show(true)

    $seeding = $E('div.seeding')
    $seeding.innerHTML = `
      <select class="block border flex-center">
        <option value="">Start new Sudoku game ...</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
        <option value="Evil">Evil</option>
        <option value="Manual">Manual Input ...</option>
      </select>
    `

    $E('select', $seeding).addEventListener('change', onSelected)
  }

  async function onSelected(event) {
    const option = firstOf(event.target.selectedOptions)
    if(! option?.value) return

    const selected = option.value
    if(selected === 'Manual') {
      $seeding.innerHTML = `
        <button class="block border flex-center">Done on Seeding</button>
      `
      $E('button', $seeding).addEventListener('click', onSeedReady)
      Sudoku.seed()
      Prompt.info(`Input the seed numbers, then click 'Done on Seeding'.`)
    } else {
      $seeding.classList.add('hidden')
      $seeding.innerHTML = ''
      Sudoku.seed(await Seed.get(selected))
      Sudoku.show()
    }
  }

  function onSeedReady() {
    $seeding.classList.add('hidden')
    $seeding.innerHTML = ''
    Sudoku.seed(Seed.READY)
    Sudoku.show()
  }

  function locale() {
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
    const locale = App.locale()
    const lang = locale.substring(0, 2)

    const qualifiers = []
    for(const qualifier of [lang, locale]) {
      if(definedQualifiers.includes(qualifier)) qualifiers.push(qualifier)
    }
    // console.debug("[DEBUG] Resolved qualifiers: %o", qualifiers);

    const scripts = qualifiers.map(qualifier => `${HREF_BASE}/scripts/i18n.resources.${qualifier}.js?${version}`);
    // console.debug("[DEBUG] Resolved dynamic scripts: %o", scripts);
    return scripts
  }

  //
  // Initialize
  //
  document.addEventListener("DOMContentLoaded", init)

  // return {
  //
  // }

})()
