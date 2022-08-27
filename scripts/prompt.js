'use strict';

window.Prompt = window.Prompt ?? (() => {

  var $panel = null

  function init() {
    appendElement('style', {type: "text/css", id: "app-prompt-panel"}, document.head).innerHTML = css()

    $panel = appendElement('div', {className: "app-prompt-panel"})
    $panel.innerHTML = ''
  }

  function message(type, text) {
    $panel.innerHTML = `
      <div class="message">
        <span class="${type}">${text}</span>
      </div>
      `
    $on($E('div', $panel), (div) => div.style.top = div.offsetHeight + 'px')
    .perform('slide-in')
    .then((div) => (div.style.top = '', div))
    .then((div) => delay(8000).then(() => div))
    .then((div) => $on(div).perform('fade-out'))
    .then((div) => div.remove())
  }

  function css() { return singleBlockCommentIn(css) /*
    .app-prompt-panel {
      display: block;
      position: absolute; z-index: 999;
      top: 90%;
      width: 100%;
      overflow: hidden;
    }

    .app-prompt-panel > .message {
      position: relative;
      width: 96%;
      margin: 0 auto;
      padding: 0 1.5vmin;
      text-align: center;

      background: rgba(255,255,255,0.6);
      font: bold clamp(14.4px, 4vmin, 18px) 'New Times Roman';
    }

    .app-prompt-panel > .message.slide-in {
      transform: translateY(-100%);
      transition: transform 0.6s ease 0.6s;
    }

    .app-prompt-panel > .message.fade-out {
      opacity: 0;
      transition: opacity 2s ease 2s;
    }

    .app-prompt-panel .info {
      color: navy;
    }

    .app-prompt-panel .warn {
      color: orange;
    }

    .app-prompt-panel .error {
      color: red;
    }

    .app-prompt-panel .success {
      color: green;
    }
  */
  }

  return {
    init,
    info: (text) => message('info', text),
    warn: (text) => message('warn', text),
    error: (text) => message('error', text),
    success: (text) => message('success', text)
  }
})()

document.addEventListener("DOMContentLoaded", Prompt.init)
