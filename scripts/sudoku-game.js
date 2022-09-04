'use strict';

window.Game = window.Game ?? (() => {

  const DONE_BUTTON_LABEL = 'Givens are Ready'

  var timer
  var $gameSelection, $givensFilled

  function init() {
    const $header = $E('div.header')
    $header.innerHTML = `
      <div>
        <div class="left">
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
        <div class="center">
          <div class="title">Sudoku</div>
          <div class="game-selection hidden"></div>
        </div>
        <div class="right buttons">
          <button class="restart" title="Restart"></button>
          <span class="timer" title="Timer">0:00:00</span>
          <button class="settings" title="Settings"></button>
        </div>
      </div>
    `
    $gameSelection = $E('.game-selection', $header)
    $E('select', $header).addEventListener('change', onSelected)
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

    window.addEventListener("puzzle-solved", onSolved)

    return Board.init()
  }

  function startup() {
    // if(Settings['start-up'] === 'resume') {
    //   // to restore & resume
    //   // TODO
    // } else {
      // to start a new game
      const level = 'Easy' // Settings['start-up']
      start(level)
    // }
  }

  function pause() {
    timer.pause()
    // save the state
  }

  function resume() {
    timer.resume()
  }

  function onSelected(event) {
    const selected = event.target.value
    if(! selected) return

    start(selected)

    event.target.value = ''
  }

  function start(selected) {
    $toggle($givensFilled, selected !== 'Manual')

    if(selected === 'Manual') {
      return Promise.resolve(Givens.EMPTY)
      .then((givens) => Board.load(givens, true)) // to start manual given filling
      .then(() => timer.reset())
      .then(() => rollingTitle('Filling Givens'))
      .then(() => Prompt.info(`Input the givens, then click '${DONE_BUTTON_LABEL}'.`))
      .catch((error) => Prompt.error(error))
    } else {
      return Givens.get(selected)
      .then((givens) => Board.load(givens))
      .then(() => timer.start())
      .then(() => rollingTitle('Level: ' + selected))
      .then(promptUsage)
      .catch((error) => Prompt.error(error))
    }
  }

  let inRolling = false
  function rollingTitle(gameSelection) {
    $gameSelection.innerHTML = gameSelection

    if(inRolling) return
    inRolling = true

    rolling($E('div.header .title'), $gameSelection)
  }

  function rolling(div1, div2) {
    Promise.resolve()
      .then(() => delay(8000)).then(() => slideOut(div1)).then(() => slideIn(div2))
      .then(() => delay(8000)).then(() => slideOut(div2)).then(() => slideIn(div1))
      .then(() => rolling(div1, div2))
  }

  function slideIn(div) {
    return Promise.resolve($show(div), div.style.top = div.offsetHeight + 'px')
      // .then(() => delay(33))
      // .then(() => console.debug("[DEBUG] Sliding in. <<< begins."))
      .then(() => $on(div).perform('slide-up'))
      // .then(() => console.debug("[DEBUG] Sliding in. <<< <<< <<< ends."))
      .then(() => div.style.top = '')
  }

  function slideOut(div) {
    return Promise.resolve()
      // .then(() => console.debug("[DEBUG] Sliding out >>> begins."))
      .then(() => $on(div).perform('slide-up'))
      .then(() => $hide(div))
      // .then(() => console.debug("[DEBUG] Sliding out >>> >>> >>> ends."))
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
    .then(() => rollingTitle('Manual Givens'))
    .then(promptUsage)
    .catch((error) => Prompt.error(error))
  }

  function onSolved() {
    timer.stop()
    Prompt.success(`
      Congratulations!<br>
      You solved this Sudoku game in ${Timer.format(timer.elapsed)}.<br>
      Keep going!
      `)
  }

  let prompted = 0
  function promptUsage() {
    if(prompted++ < 3) Prompt.info('Tap or click the cell for more auxiliary options.')
  }

  return {
    init,
    startup,
    pause,
    resume
  }

})()
