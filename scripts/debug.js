'use strict';

(function() {

if(! location.href.match(/\bdebug\b/gi)) return

function show() {
  appendElement('div', {id: 'debug'}).innerHTML = /*html*/`
    <hr/>
    <div>standalone mode: ${new URL(location.href).searchParams.get('mode') === 'standalone'}</div>
    <div>navigator.language: ${navigator.language}</div>
    <div>Resolved Locale: ${resolveNavigatorLocale()}</div>
  `
}

document.addEventListener("DOMContentLoaded", show)

})()
