'use strict';

window.Game = window.Game ?? (() => {

  const DONE_BUTTON_LABEL = 'Givens are Ready'
  const COMPLETION_MESSAGES = {
    'easy': "That was easy!",
    'medium': "That wasn't easy!",
    'hard': "That was hard!",
    'expert': "You're an expert!",
    'manual': "The givens were manully filled in.",
  }

  const state = {
    selected: 'easy',
    timer: {elapsed: 0, status: 'stopped'},
    title: ''
  }

  var timer
  var $gameSelection, $givensFilled

  function init() {
    const $header = $E('div.header')
    $header.innerHTML = `
      <div>
        <div class="left">
          <select class="block border">
            <option value="">New Game ...</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
            <!-- <option value="Import">Import Givens from Clipboard</option> -->
            <option value="manual">Manually Filling in Givens</option>
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
    $E('.settings', $header).addEventListener('click', Settings.View.show)

    $E('.commands .buttons').innerHTML = `
      <button class="block border hidden" id="undo"><span class="cmd-text"> Undo</span></button>
      <button class="block border hidden" id="givens-filled">${DONE_BUTTON_LABEL}</button>
      <button class="block border hidden" id="eliminate-by-rules">Eliminate by Row, Column, and Box</button>
      <button class="block border hidden" id="mark-cross-hatching">Mark Cross-Hatching</button>
      <button class="block border" id="clean"><span class="cmd-text">Erase </span></button>
    `
    $givensFilled = $E('button#givens-filled')
    $givensFilled.addEventListener('click', onGivensFilled)

    timer = new Timer('.header .timer')

    window.addEventListener("puzzle-solved", onSolved)
    window.addEventListener("overlay-rendered", () => timer.pause())
    window.addEventListener("overlay-closed", () => timer.resume())

    return Board.init()
  }

  function startup() {
    function _do_(onStartup) {
      const [matched, selected] = onStartup?.match(/^start-(easy|medium|hard|expert|manual)$/) ?? []
      if(matched) {
        start(selected)
      } else {
        Prompt.error(`Invalid Settings.onStartup value '${onStartup}'!`)
      }
    }

    const onStartup = Settings.onStartup
    if(onStartup === 'resume') {
      restore()
        .then((game) => {
          if(Object.isEmpty(game)) {
            console.info("[INFO] No saved game exists while trying to restore and resume.")
            _do_(Settings.startupFallback)
          } else {
            console.info(`[INFO] Successfully restored the game to its status at ${Timer.format(game.timer.elapsed)}.`)
          }
        })
        .catch((error) => {
          console.error("[ERROR] Error occurred while trying to restore!", error)
          Prompt.error(error)
          .then(() => _do_(Settings.DEFAULT.onStartup))
        })
    } else {
      _do_(onStartup)
    }
  }

  function pause() {
    // save the state
    State.set({
      game: snapshot(),
      board: Board.snapshot(),
      assumptions: Assumptions.snapshot()
    })

    timer.pause()
  }

  function snapshot() {
    state.timer = timer.snapshot()
    return state
  }

  function restore() {
    return State.load()
      .then(({game, board, assumptions}) =>
        Object.isEmpty(game)
        ? Promise.resolve(game)
        : Assumptions.restore(assumptions)
          .then(() => Board.restore(board))
          .then(() => Object.assign(state, game))
          .then(() => timer.restore(game.timer))
          .then(() => rollingTitle(game.title))
          .then(() => game)
      )
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
    state.selected = selected

    $toggle($givensFilled, selected !== 'manual')

    if(selected === 'manual') {
      return Promise.resolve(Givens.EMPTY)
        .then((givens) => Board.load(givens, true)) // to start manual given filling
        .then(() => timer.reset())
        .then(() => rollingTitle('Filling in Givens'))
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
    state.title = gameSelection

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
      You solved the Sudoku in ${Timer.format(timer.elapsed)}.<br>
      ${COMPLETION_MESSAGES[state.selected]} Keep going!
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
