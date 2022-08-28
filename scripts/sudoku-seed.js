'use strict';

window.Seed = window.Seed ?? (() => {

  const EMPTY = ['EMPTY']
  const FILLED = ['FILLED']

  const Difficulty = {
    Any: 0,
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Expert: 4
  };

  const Symmetry = {
    None: 0,
    Rotate90: 1,
    Rotate180: 2,
    Mirror: 3,
    Flip: 4,
    Random: 5
  }

  const OutputFormat = {
    OneLine: 0,
    Compact: 1,
    Readable: 2,
    Csv: 3
  }

  const generator = new qqwing()

  /**
   * Get a Sudoku's seed data by the given difficulty level and symmetry.
   *
   * @param {enum} level Any, Easy, Medium, Hard, Expert
   * @param {enum} symmetry None, Rotate90, Rotate180, Mirror, Flip, Random
   */
  function get(level, symmetry) {
    return new Promise((resolve, reject) => {

      const difficulty = Difficulty[level] ?? Difficulty.Easy
      const mode = Symmetry[symmetry] ?? Symmetry.Random
      let count = 0
      do {
        generator.setRecordHistory(difficulty !== Difficulty.Any)
        generator.setPrintStyle(OutputFormat.OneLine)
        generator.generatePuzzleSymmetry(mode)
        if(difficulty !== Difficulty.Any) generator.solve()
        count++
        // console.debug("[DEBUG] Resolved puzzle, difficulty: %o <-> %o, count: %o",
        //   difficulty, generator.getDifficulty(), count)

        if(count >= 300) {
          reject(`Could not generate puzzle at difficulty level ${difficulty} in ${count} tries!`)
          break
        }
      } while (!(difficulty === Difficulty.Any || generator.getDifficulty() === difficulty))

      resolve(toMatrix(generator.getPuzzleString()))
    })
  }

  function toMatrix(puzzle) {
    // console.debug("[DEBUG] Calling toMatrix(\n%s) ...", puzzle)

    const letters = '.123456789'
    const result = Array(CONFIG.scale)

    let index = 0, value, length = puzzle.length
    for(let rowIndex = 0; rowIndex < CONFIG.scale; rowIndex++) {
      const row = Array(CONFIG.scale)
      for(let colIndex = 0; colIndex < CONFIG.scale; colIndex++) {
        do {
          value = letters.indexOf(puzzle.charAt(index++))
        } while(value === -1 && index < length)
        row[colIndex] = value < 0 ? 0 : value
      }
      result[rowIndex] = row
    }

    return result
  }

  return {
    EMPTY,
    FILLED,
    Difficulty,
    Symmetry,
    get
  }
})()
