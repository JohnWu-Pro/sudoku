'use strict';

class Settings {
  static DEFAULT = Object.freeze({
    // resume | start-Easy | start-Medium | start-Hard | start-Expert | start-Manual
    onStartup: 'start-Easy',

    checkCorrectnessbyRules: true,
    countSolvedNumbers: true,
    eliminateByRules: true,
    highlightSolvedSameValue: true,
    markCrossHatching: true,
    markEliminated: false,
    traceAssumptions: true,
  })

  static #instance = Object.seal({...Settings.DEFAULT})
  static {
    State.load()
    .then((cache) => Object.assign(Settings.#instance, cache.settings ?? {}))
    .then(() => Settings.#instance.onStartup = 'resume')
    .then(() => console.debug("[DEBUG] Loaded settings: %o", Settings.#instance))
  }

  static get onStartup() { return Settings.#instance.onStartup }
  static get checkCorrectnessbyRules() { return Settings.#instance.checkCorrectnessbyRules }
  static get countSolvedNumbers() { return Settings.#instance.countSolvedNumbers }
  static get eliminateByRules() { return Settings.#instance.eliminateByRules }
  static get highlightSolvedSameValue() { return Settings.#instance.highlightSolvedSameValue }
  static get markCrossHatching() { return Settings.#instance.markCrossHatching }
  static get markEliminated() { return Settings.#instance.markEliminated }
  static get traceAssumptions() { return Settings.#instance.traceAssumptions }

  static update(settings) {
    Object.assign(Settings.#instance, settings)
    return State.set({settings: Settings.#instance})
  }

}
