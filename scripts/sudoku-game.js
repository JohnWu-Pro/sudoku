'use strict';

window.Game = window.Game ?? (() => {

  const DONE_BUTTON_LABEL = 'Givens are Ready'

  var timer = null
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
    $E('.restart', $header).addEventListener('click', onRestart)

    $E('.commands .buttons').innerHTML = `
      <button class="block border" id="undo"><span> Undo</span></button>
      <button class="block border hidden" id="seed-filled">${DONE_BUTTON_LABEL}</button>
      <button class="block border hidden" id="eliminate-by-rules">Eliminate by Row, Column, and Box</button>
      <button class="block border" id="clean"><span>Erase </span></button>
    `
    $seedFilled = $E('button#seed-filled')
    $seedFilled.addEventListener('click', onSeedFilled)

    timer = new Timer('.header .buttons .timer')
    return Board.init()
  }

  function onNewGame(event) {
    const selected = event.target.value
    if(! selected) return

    if(selected === 'Manual') {
      Promise.resolve(Seed.EMPTY)
      .then((seed) => Board.start(seed, true)) // to start manual seeding
      Prompt.info(`Input the givens, then click '${DONE_BUTTON_LABEL}'.`)
      $show($seedFilled)
    } else {
      $hide($seedFilled)
      start(selected)
    }
    event.target.value = ''
  }

  function start(level) {
    return Seed.get(level ?? 'Easy') // TODO: based on Config
    .then((seed) => Board.start(seed))
    .then(() => timer.start())
    .then(promptUsage)
    .catch((error) => Prompt.error(error))
  }

  function onRestart() {
    Board.restart()
    .then(() => timer.start())
  }

  function onSeedFilled() {
    $hide($seedFilled)
    Promise.resolve(Seed.FILLED)
    .then((seed) => Board.start(seed))
    .then(() => timer.start())
    .then(promptUsage)
  }

  let prompted = 0
  function promptUsage() {
    if(prompted++ < 3) Prompt.info('Tap or click the cell for more assistive actions.')
  }

  return {
    init,
    start,
    // pause (and save), (restore then) resume
  }

})()

document.addEventListener("DOMContentLoaded", Game.run)
