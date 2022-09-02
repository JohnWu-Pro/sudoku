'use strict';

window.InstallPrompt = window.InstallPrompt ?? (() => {

var panel = null, button = null
var promptEvent = null

function onBeforePrompt(event) {
  event.preventDefault()
  promptEvent = event

  show()
}

function onClick() {
  // console.debug("[DEBUG] Calling InstallPrompt.onClick() ...")

  if(!promptEvent) {
    console.warn("[WARN] The install prompt event isn't available!")
    return
  }

  // Hide the prompt button
  hide()

  // Prompt the installation
  const event = promptEvent
  event.prompt()
    .then(() => event.userChoice)
    .then(choice => {
      // either "accepted" or "dismissed"
      console.info("[INFO] Install prompt user choice: %s", choice.outcome)
    })
    .then(onAfterPrompted)
}

function onAfterPrompted() {
  promptEvent = null
}

function show() {
  // console.debug("[DEBUG] Calling InstallPrompt.show() ...")

  // Preload install icon
  appendElement('link', {rel: "preload", href: "install/icon.png", as: "image"}, document.head)

  // Load style and div
  appendElement('style', {type: "text/css", id: "install-prompt"}, document.head).innerHTML = css()

  panel = appendElement('div', {className: "install-prompt-panel"})
  panel.innerHTML = content()

  button = $E('button', panel)

  // Slide in
  $on(button, () => button.style.left = button.offsetWidth + 'px')
  .perform('slide-in')
  .then(() => button.style.left = '')
  .then(() => delay(180000))
  .then(() => { hide(); onAfterPrompted(); })
}

function hide() {
  if(!button) return

  $on(button)
  .perform('slide-out')
  .then(() => {
    $E('div.install-prompt-panel').remove()
    $E('style#install-prompt', document.head).remove()
    $E('link[href="install/icon.png"]', document.head).remove()
  })

  button = null
  panel = null
}

function css() { return blockCommentOf(css) /*
  .install-prompt-panel {
    z-index: 999; position: absolute;
    margin: clamp(1.8px, 0.5vmin, 2.1px) 0;
    width: 64vw;
    left: 36vw; top: 93.6vh;
    text-align: right;
    overflow: hidden;
  }

  .install-prompt-panel > button {
    position: relative;
    border: 1px outset #eaeaea;
    border-radius: clamp(21.6px, 6vmin, 25.2px) 0 0 clamp(21.6px, 6vmin, 25.2px);
    padding: clamp(5.4px, 1.5vmin, 6.3px) clamp(10.8px, 3vmin, 12.6px) clamp(5.4px, 1.5vmin, 6.3px) clamp(16.2px, 4.5vmin, 18.9px);
    display: inline-block;
    font: normal clamp(16.2px, 4.5vmin, 18.9px) 'New Times Roman';
    text-align: center;
    cursor: pointer;
    background: #f0f0ff;
    color: #e066ff;
    white-space: nowrap;
  }

  .install-prompt-panel > button.slide-in {
    transform: translateX(-100%);
    transition: transform 1s 0.3s;
  }

  .install-prompt-panel > button.slide-out {
    transform: translateX(100%);
    transition: transform 1s 0.3s;
  }

  .install-prompt-panel > button > img {
    position: relative;
    top: clamp(1.8px, 0.5vmin, 2.1px);
    height: clamp(21.6px, 6vmin, 25.2px);
    width: clamp(21.6px, 6vmin, 25.2px);
  }

  .install-prompt-panel > button > span {
    position: relative;
    top: clamp(-4.2px, -1vmin, -3.6px);
    padding: 0 clamp(3.6px, 1vmin, 4.2px);
  }
*/}

function content() { return blockCommentOf(content) /*
  <button type="button" onclick="InstallPrompt.onClick()"><img src="install/icon.png"><span>Add to Home Screen</span></button>
*/}

function blockCommentOf(func) { return func.toString().replace(/^[^\/]+\/\*/, '').replace(/\*\/[^\/]+$/, '') }

return {onBeforePrompt, onClick, onAfterPrompted}

})()
