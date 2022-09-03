'use strict';

window.Game = window.Game ?? (() => {

  const DONE_BUTTON_LABEL = 'Givens are Ready'

  var timer = null
  var $givensFilled = null

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
            <!-- <option value="Import">Import Givens</option> -->
            <option value="Manual">Manually Input Givens</option>
          </select>
        </div>
        <div>
          <span class="title">Sudoku</span>
        </div>
        <div class="buttons">
          <button class="restart" title="Restart"></button>
          <span class="timer" title="Timer">0:00:00</span>
          <button class="settings" title="Settings"></button>
        </div>
      </div>
    `
    $E('select', $header).addEventListener('change', onNewGame)
    $E('.restart', $header).addEventListener('click', onRestart)

    $E('.commands .buttons').innerHTML = `
      <button class="block border" id="undo"><span> Undo</span></button>
      <button class="block border hidden" id="givens-filled">${DONE_BUTTON_LABEL}</button>
      <button class="block border hidden" id="eliminate-by-rules">Eliminate by Row, Column, and Box</button>
      <button class="block border" id="clean"><span>Erase </span></button>
    `
    $givensFilled = $E('button#givens-filled')
    $givensFilled.addEventListener('click', onGivensFilled)

    timer = new Timer('.header .buttons .timer')

    return Board.init()
  }

  function onNewGame(event) {
    const selected = event.target.value
    if(! selected) return

    if(selected === 'Manual') {
      Promise.resolve(Givens.EMPTY)
      .then((givens) => Board.load(givens, true)) // to start manual given filling
      Prompt.info(`Input the givens, then click '${DONE_BUTTON_LABEL}'.`)
      $show($givensFilled)
    } else {
      $hide($givensFilled)
      start(selected)
    }
    event.target.value = ''
  }

  function start(level) {
    return Givens.get(level ?? 'Easy') // TODO: based on Config
    .then((givens) => Board.load(givens))
    .then(() => timer.start())
    .then(promptUsage)
    .catch((error) => Prompt.error(error))
  }

  function pause() {
    // pause
    // save the state
  }

  function resume() {
    // might need to restore state first
    // resume
  }

  function onRestart() {
    Board.reload()
    .then(() => timer.start())
  }

  function onGivensFilled() {
    $hide($givensFilled)
    Promise.resolve(Givens.FILLED)
    .then((givens) => Board.load(givens))
    .then(() => timer.start())
    .then(promptUsage)
  }

  let prompted = 0
  function promptUsage() {
    if(prompted++ < 3) Prompt.info('Tap or click the cell for more auxiliary options.')
  }

  return {
    init,
    start,
    pause,
    resume
  }

})()
