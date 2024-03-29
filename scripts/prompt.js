'use strict';

window.Prompt = window.Prompt ?? (() => {

  var $panel = null

  function init() {
    appendElement('style', {type: "text/css", id: "app-prompt-panel"}, document.head).textContent = css()

    $panel = appendElement('div', {className: "app-prompt-panel"})
    $panel.innerHTML = ''
  }

  function message(type, html) {
    $panel.innerHTML = /*html*/`
      <div class="message">
        <span class="${type}">${html}</span>
      </div>
    `
    $panel.style.top = `calc(96dvh - ${$panel.offsetHeight}px)`
    return Promise.resolve($E('div', $panel))
    .then((div) => (div.style.top = `${div.offsetHeight}px`, div))
    .then((div) => $on(div).perform('slide-in'))
    .then((div) => (div.style.top = '', div))
    .then((div) => delay(8000, div))
    .then((div) => $on(div).perform('fade-out'))
    .then((div) => div.remove())
  }

  function css() { return /*css*/`
    .app-prompt-panel {
      display: block;
      position: absolute; z-index: 99;
      top: 90%;
      width: 100%;
      overflow: hidden;
    }

    .app-prompt-panel > .message {
      position: relative;
      width: 96%;
      margin: 0 auto;
      padding: 0 var(--size-1_5vmin);
      text-align: center;

      background: rgba(255,255,255,0.6);
      font: bold var(--size-4vmin) var(--main-font-family);
    }

    .app-prompt-panel > .message > span {
      display: inline-block;
      margin: 3px;
      padding: 3px 6px;
      border: 2px solid;
      border-radius: var(--size-1vmin);
    }

    .app-prompt-panel > .message.slide-in {
      transform: translateY(-100%);
      transition: transform 0.6s ease;
    }

    .app-prompt-panel > .message.fade-out {
      opacity: 0;
      transition: opacity 2s ease;
    }

    .app-prompt-panel .info {
      border-color: navy;
      color: navy;
    }

    .app-prompt-panel .warn {
      border-color: orange;
      color: orange;
    }

    .app-prompt-panel .error {
      border-color: red;
      color: red;
    }

    .app-prompt-panel .success {
      border-color: green;
      color: green;
    }
    `.replaceAll(/    /g, '')
  }

  //
  // Initialize
  //
  document.addEventListener("DOMContentLoaded", init)

  return {
    info: (html) => message('info', html),
    warn: (html) => message('warn', html),
    error: (html) => message('error', html),
    success: (html) => message('success', html)
  }
})()
