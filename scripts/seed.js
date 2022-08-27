'use strict';

window.Seed = window.Seed ?? (() => {

  const EMPTY = Array(CONFIG.scale).fill(Array(CONFIG.scale).fill(0))
  const READY = 'READY'

  /**
   * Get a Sudoku's seed data by the level or id.
   *
   * @param {enum} level Easy, Medium, Hard, Evil
   * @param {number} id the Sudoku's seed data id
   */
  function get(level, id) {
    return [
      [4,7,0,0,0,0,0,5,8],
      [5,8,0,7,0,4,0,9,1],
      [0,0,0,5,0,1,0,0,0],
      [0,2,4,0,0,0,5,1,0],
      [0,0,0,0,0,0,0,0,0],
      [0,5,8,0,0,0,9,4,0],
      [0,0,0,8,0,5,0,0,0],
      [8,4,0,1,0,3,0,6,5],
      [1,3,0,0,0,0,0,8,2]
    ]
  }

  return {
    EMPTY,
    READY,
    get
  }
})()
