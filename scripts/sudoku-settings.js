'use strict';

class Settings {
  static startupFallback = 'start-Easy'

  static DEFAULT = Object.freeze({
    // resume | start-Easy | start-Medium | start-Hard | start-Expert | start-Manual
    onStartup: 'resume',

    allowUndo: true,
    checkCorrectnessbyRules: true,
    countSolvedNumbers: true,
    eliminateByRules: true,
    highlightSolvedSameValue: true,
    markCrossHatching: true,
    markEliminated: false, // To be named
    traceAssumptions: true,
  })

  static #instance = Object.seal({...Settings.DEFAULT})
  static {
    State.load()
    .then((cache) => Object.assign(Settings.#instance, cache.settings ?? {}))
    // .then(() => Settings.update({
    //   allowUndo: false,
    //   checkCorrectnessbyRules: false,
    //   countSolvedNumbers: false,
    //   eliminateByRules: false,
    //   highlightSolvedSameValue: false,
    //   markCrossHatching: false,
    //   markEliminated: false,
    //   traceAssumptions: false,
    // }))
    // .then(() => console.debug("[DEBUG] Loaded settings: %o", Settings.#instance))
  }

  static get onStartup() { return Settings.#instance.onStartup }

  static get allowUndo() { return Settings.#instance.allowUndo }
  static get checkCorrectnessbyRules() { return Settings.#instance.checkCorrectnessbyRules }
  static get countSolvedNumbers() { return Settings.#instance.countSolvedNumbers }
  static get eliminateByRules() { return Settings.#instance.eliminateByRules }
  static get highlightSolvedSameValue() { return Settings.#instance.highlightSolvedSameValue }
  static get markCrossHatching() { return Settings.#instance.markCrossHatching }
  static get markEliminated() { return Settings.#instance.markEliminated }
  static get traceAssumptions() { return Settings.#instance.traceAssumptions }

  static instance() {
    return {...Settings.#instance}
  }

  static update(settings) {
    Object.assign(Settings.#instance, settings)
    return State.set({settings: Settings.#instance})
  }

}
