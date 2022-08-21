'use strict';

class Seed {

  /**
   * Get a Sudoku's seed data by the level or id.
   *
   * @param {enum} level Easy, Medium, Hard, Evil
   * @param {number} id the Sudoku's seed data id
   */
  static get(level, id) {
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
}
