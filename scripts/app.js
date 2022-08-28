'use strict';

window.App = window.App ?? (() => {

  const DONE_BUTTON_LABEL = 'Done on Filling in Givens'

  const currentScript = document.currentScript

  var $seeding = null

  function init() {
    // console.debug("[DEBUG] Calling App.init() ...")

    Sudoku.init()
    Promise.resolve(Seed.EMPTY)
    .then((data) => Sudoku.seed(data))
    .then(() => Sudoku.show(true))

    $seeding = $E('div.seeding')
    $seeding.innerHTML = `
      <select class="block border flex-center">
        <option value="">Start new Sudoku game ...</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
        <option value="Expert">Expert</option>
        <option value="Manual">Manually Fill in Givens ...</option>
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
        <button class="block border flex-center">${DONE_BUTTON_LABEL}</button>
      `
      $E('button', $seeding).addEventListener('click', onSeedFilled)
      Prompt.info(`Fill in the givens, then click '${DONE_BUTTON_LABEL}'.`)
      Sudoku.seed()
    } else {
      $seeding.classList.add('hidden')
      $seeding.innerHTML = ''
      Seed.get(selected)
      .then((data) => Sudoku.seed(data))
      .then(() => Sudoku.show())
      .catch((error) => Prompt.error(error))
    }
  }

  async function onSeedFilled() {
    $seeding.classList.add('hidden')
    $seeding.innerHTML = ''
    Promise.resolve(Seed.FILLED)
    .then((data) => Sudoku.seed(data))
    .then(() => Sudoku.show())
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
