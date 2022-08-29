'use strict';

window.Seed = window.Seed ?? (() => {

  const EMPTY = 'EMPTY'
  const FILLED = 'FILLED'

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

      resolve(parse(generator.getPuzzleString()))
    })
  }

  /**
   * Parse the string puzzle into a 2-demention number matrix (0 indicates empty cell).
   *
   * Digit 1-9 indicates a valid value for a cell,
   * '.' or '0' indicates an empty cell,
   * all other characters will be siliently ignored.
   *
   * Acceptable puzzle examples:
   *
   * A) One Line:
   *  ...4..5.........2.....71.84..91...4...678....8...2...6.8.6.....4.....75......2.91
   *
   * B) Compact:
   *  ......746
   *  ...4...3.
   *  ..32641..
   *  9.....3..
   *  .41..7.2.
   *  ...92....
   *  3...7.4..
   *  .9.8.16..
   *
   * C) Readable:
   *  . . . | . . . | . 8 .
   *  . . . | . 6 . | . 4 .
   *  8 1 4 | 3 . 9 | . . .
   * -------|-------|-------
   *  . 5 . | . . 8 | . 3 .
   *  7 . 1 | . . 6 | . . 8
   *  . . . | 4 . . | 9 . .
   * -------|-------|-------
   *  . . . | . . 4 | . . 7
   *  . 9 . | 1 5 . | . . .
   *  . . 8 | . . . | 1 . .
   *
   * @param {string} puzzle the Sudoku given numbers in string
   * @return {array} a 2-demention number matrix
   */
  function parse(puzzle) {
    // console.debug("[DEBUG] Calling parse(\n%s) ...", puzzle)

    const dot = '.'.codePointAt(0)
    const zero = '0'.codePointAt(0)
    const nine = '9'.codePointAt(0)

    const result = Array(CONFIG.scale)

    let index = 0, value, length = puzzle.length
    for(let rowIndex = 0; rowIndex < CONFIG.scale; rowIndex++) {
      const row = Array(CONFIG.scale)
      for(let colIndex = 0; colIndex < CONFIG.scale; colIndex++) {
        do {
          if(index >= length) throw Error('Invalid puzzle input:\n' + puzzle)

          const cp = puzzle.codePointAt(index++)
          value = cp === dot ? 0 : (zero <= cp && cp <= nine) ? (cp - zero) : -1
        } while(value === -1)
        row[colIndex] = value
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
    parse,
    get
  }
})()
