
div.ejfun-msg-panel {
  background: rgba(255,255,255,0.6);
  padding: 0 0 0 6px;
  font-weight: bold;
  text-align: left;
}

div.ejfun-msg-panel > .success {
  color: green;
}

div.ejfun-msg-panel > .error {
  color: red;
}

div.ejfun-msg-panel > .info {
  color: black;
}

<div class="ejfun-msg-panel">
  <span class="info">请按照提示操作：... ...</span>
</div>

let timeoutId = null;
function prompt(type, msg) {
  if(timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  let elem = $E('.prompt-panel span', document);
  elem.className = type;
  elem.innerHTML = msg;

  timeoutId = setTimeout(function() {
    timeoutId = null;
    $E('.prompt-panel span', document).innerHTML = '';
  }, 10000);
}
