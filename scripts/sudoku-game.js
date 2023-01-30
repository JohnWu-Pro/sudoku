'use strict';

window.Game = window.Game ?? (() => {

  const state = {
    selected: 'easy',
    timer: {elapsed: 0, status: 'stopped'},
    title: ''
  }

  var timer
  var $gameSelection, $givensFilled, $success

  function init() {
    const $header = appendElement('div', {className: 'header'})
    $header.innerHTML = `
      <div>
        <div class="left">
          <select class="block border">
            <option value="">${T('game.new.placeholder')}</option>
            <option value="simple">${T('game.new.simple')}</option>
            <option value="easy">${T('game.new.easy')}</option>
            <option value="intermediate">${T('game.new.intermediate')}</option>
            <option value="expert">${T('game.new.expert')}</option>
            <!-- <option value="import">${T('game.new.import')}</option> -->
            <option value="manual">${T('game.new.manual')}</option>
          </select>
        </div>
        <div class="center">
          <div class="title">${T('game.title')}</div>
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

    appendElement('div', {className: 'board'}).innerHTML = `
      <div class="grid"></div>
      <div class="keys"></div>
      <div class="commands">
        <div class="buttons">
          <button class="block border hidden" id="undo"><span class="cmd-text"> ${T('game.button.undo')}</span></button>
          <button class="block border hidden" id="givens-filled">${T('game.button.givens-filled')}</button>
          <button class="block border hidden" id="eliminate-by-rules">${T('game.button.eliminate-by-rules')}</button>
          <button class="block border hidden" id="mark-cross-hatching">${T('game.button.mark-cross-hatching')}</button>
          <button class="block border" id="clean"><span class="cmd-text">${T('game.button.erase')} </span></button>
        </div>
        <div class="assumptions">
          <div class="pending"></div>
          <div class="tentative"></div>
        </div>
      </div>
      <!-- <div class="references hidden">
        <span class="label">References ...</span>
        <div class="options">
          <a class="option" href="">Basic Rules</a>
          <a class="option" href="">Cross Hatching</a>
        </div>
      </div> -->
    `
    $givensFilled = $E('button#givens-filled')
    $givensFilled.addEventListener('click', onGivensFilled)

    $success = appendElement('audio', {src: '../audios/success.mp3', preload: 'auto'})

    timer = new Timer('.header .timer')

    window.addEventListener("puzzle-solved", onSolved)
    window.addEventListener("overlay-rendered", () => timer.pause())
    window.addEventListener("overlay-closed", () => timer.resume())

    return Board.init()
  }

  function startup() {
    function _do_(onStartup) {
      const [matched, selected] = onStartup?.match(/^start-(simple|easy|intermediate|expert|manual)$/) ?? []
      if(matched) {
        start(selected)
      } else {
        console.error(`Invalid Settings.onStartup: ${onStartup}`)
      }
    }

    const onStartup = Settings.onStartup
    if(onStartup === 'resume') {
      restore()
        .then((game) => {
          if(Object.isEmpty(game)) {
            console.info("[INFO] No saved game exists while trying to restore and resume.")
            _do_(Settings.bootstrap)
          } else {
            console.info(`[INFO] Successfully restored the game to its status at ${Timer.format(game.timer.elapsed)}.`)
          }
        })
        .catch((error) => {
          console.error("[ERROR] Error occurred while trying to restore!", error)
          Prompt.error(error)
          .then(() => _do_(Settings.bootstrap))
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
        .then(() => rollingTitle(T('game.selection.filling-in-givens')))
        .then(() => Prompt.info(T('game.info.input-givens-then-click-done', {button: T('game.button.givens-filled')})))
        .catch((error) => Prompt.error(error))
    } else {
      return Givens.get(capitalize(selected))
        .then((givens) => Board.load(givens))
        .then(() => timer.start())
        .then(() => rollingTitle(T('game.selection.level-' + selected)))
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
      .then(() => $on(div).perform('slide-up'))
      .then(() => div.style.top = '')
  }

  function slideOut(div) {
    return Promise.resolve()
      .then(() => $on(div).perform('slide-up'))
      .then(() => $hide(div))
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
      .then(() => rollingTitle(T('game.selection.manual-givens')))
      .then(promptUsage)
      .catch((error) => Prompt.error(error))
  }

  function onSolved() {
    timer.stop()
    $success.play()
    Prompt.success(T('game.congratulations', {
      'duration': Timer.format(timer.elapsed),
      'completion-message': T('game.completion-message.' + state.selected)
    }))
  }

  let prompted = 0
  function promptUsage() {
    if(prompted++ < 3) Prompt.info(T('game.info.more-auxiliary-functions'))
  }

  return {
    init,
    startup,
    pause,
    resume
  }

})()
