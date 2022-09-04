'use strict';

// `self` may be used to refer to the global scope that will work not only
// in a window context (self will resolve to window.self) but also
// in a worker context (self will then resolve to WorkerGlobalScope.self)

const HREF_BASE = hrefBase(location)
const CONTEXT_PATH = contextPath(location)
const INT_UNDEFINED = -1

function delay(millis, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), millis))
}

function hrefBase(location) {
  return location.href.substring(0, location.href.lastIndexOf('/'))
}

function contextPath(location) {
  return location.pathname.substring(0, location.pathname.lastIndexOf('/'))
}

function versionOf(script) {
  return (new URL(script.src).search ?? '').replace(/^\?(?:v=)?/, '')
}

function resolveNavigatorLocale() {
  return navigator.language.replace(/^([a-z]{2})(?:-[a-z]+)??-([A-Z]{2})$/, '$1-$2')
}

function singleBlockCommentIn(fun) {
  return fun.toString().replace(/^[^\/]+\/\*/, '').replace(/\*\/[^\/]+$/, '')
}
