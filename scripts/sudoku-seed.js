'use strict';

window.Seed = window.Seed ?? (() => {

  const EMPTY = ['EMPTY']
  const FILLED = ['FILLED']

  /**
   * Get a Sudoku's seed data by the level or id.
   *
   * @param {enum} level easy, medium, hard, master
   * @param {number} id the Sudoku's seed data id
   */
  function get(level, id) {
    return new Promise((resolve) => resolve(
      Generator.generate(Generator.Levels[level]).puzzle
    ))
    // console.debug("[DEBUG] Generated puzzle: %o", puzzle)

    // NOTE:
    // The generator labels the columns 1-9, the rows A-I.
    // While in this app, we label the columns A-I, the rows 1-9.
    // The two different notations would interpret the same puzzle into
    // two grids that are symmetrically equivalent by a simple diagonal flip.

    // return [
    //   [4,7,0,0,0,0,0,5,8],
    //   [5,8,0,7,0,4,0,9,1],
    //   [0,0,0,5,0,1,0,0,0],
    //   [0,2,4,0,0,0,5,1,0],
    //   [0,0,0,0,0,0,0,0,0],
    //   [0,5,8,0,0,0,9,4,0],
    //   [0,0,0,8,0,5,0,0,0],
    //   [8,4,0,1,0,3,0,6,5],
    //   [1,3,0,0,0,0,0,8,2]
    // ]
  }

  return {
    EMPTY,
    FILLED,
    get
  }
})()
