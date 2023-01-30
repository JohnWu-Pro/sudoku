'use strict';

// `self` may be used to refer to the global scope that will work not only
// in a window context (self will resolve to window.self) but also
// in a worker context (self will then resolve to WorkerGlobalScope.self)

const HREF_BASE = hrefBase(location)
const CONTEXT_PATH = contextPath(location)

const {APP_BASE, LOCALE} = ((base) => {
  const LOCALE = Config.supportedLocales.find((locale) => base.endsWith('/' + locale)) ?? ''
  return {
    APP_BASE: LOCALE ? base.substring(0, base.length - (LOCALE.length+1)) : base,
    LOCALE
  }
})(HREF_BASE)

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

Object.isEmpty = function(object) {
  return !object
    || object.length === 0
    || object.size === 0
    || Object.keys(object).length === 0
}

Array.replace = function(target, subs) {
  target.length = 0
  if(!Object.isEmpty(subs)) target.push(...subs)
}

function capitalize(word) {
  return word[0].toUpperCase() + word.substring(1)
}

function camelize(hyphenized) {
  return hyphenized
    .split('-')
    .map((word, i) => i===0 ? word : word[0].toUpperCase() + word.substring(1))
    .join('')
}

function hyphenize(camelized) {
  return camelized.replaceAll(/([^A-Z])([A-Z])/g, '$1-$2').toLowerCase()
}
