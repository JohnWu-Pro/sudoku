'use strict';

window.App = window.App ?? (() => {

  const DONE_BUTTON_LABEL = 'Givens are Ready'

  const currentScript = document.currentScript

  var $seedFilled = null

  function init() {
    const $header = $E('div.header')
    $header.innerHTML = `
      <div>
        <div>
          <select class="block border">
            <option value="">New Game ...</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
            <option value="Manual">Manually Input Givens</option>
          </select>
        </div>
        <div>
          <span class="title">Sudoku</span>
        </div>
        <div class="buttons">
          <button class="timer">0:00:00</button>
          <button class="restart" title="Restart"></button>
        </div>
      </div>
    `
    $E('select', $header).addEventListener('change', onNewGame)
    $E('.restart', $header).addEventListener('click', Sudoku.restart)

    $E('.commands .buttons').innerHTML = `
      <button class="block border" id="undo"><span> Undo</span></button>
      <button class="block border hidden" id="seed-filled">${DONE_BUTTON_LABEL}</button>
      <button class="block border hidden" id="eliminate-by-rules">Eliminate by Row, Column, and Box</button>
      <button class="block border" id="clean"><span>Erase </span></button>
    `
    $seedFilled = $E('button#seed-filled')
    $seedFilled.addEventListener('click', onSeedFilled)

    $E('div.footer').innerHTML = `
      <a href="https://mozilla.org/MPL/2.0/" target="_blank">版权所有</a>
      &copy; 2022
      <a href="mailto: johnwu.pro@gmail.com" target="_blank">吴菊华</a>。
      适用版权许可 <a href="javascript:openDoc('LICENSE.txt', '版权许可')" title="License Detail">MPL-2.0</a>。
    `

    Sudoku.init()
    play('Easy')
  }

  function onNewGame(event) {
    const selected = event.target.value
    if(! selected) return

    if(selected === 'Manual') {
      $show($seedFilled)
      Promise.resolve(Seed.EMPTY)
      .then((seed) => Sudoku.start(seed, true)) // to start manual seeding
      Prompt.info(`Input the givens, then click '${DONE_BUTTON_LABEL}'.`)
    } else {
      $hide($seedFilled)
      play(selected)
    }
    event.target.value = ''
  }

  function play(game) {
    Seed.get(game)
    .then((seed) => Sudoku.start(seed))
    .then(promptUsage)
    .catch((error) => Prompt.error(error))
  }

  function onSeedFilled() {
    $hide($seedFilled)
    Promise.resolve(Seed.FILLED)
    .then((seed) => Sudoku.start(seed))
    .then(promptUsage)
  }

  let prompted = 0
  function promptUsage() {
    if(prompted++ < 3) Prompt.info('Tap or click the cell for more assistive actions.')
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
