'use strict';

window.Givens = window.Givens ?? (() => {

  const EMPTY = 'EMPTY'
  const FILLED = 'FILLED'

  const Difficulty = {
    Any: 0,
    Simple: 1,
    Easy: 2,
    Intermediate: 3,
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
   * Get a Sudoku givens by the specified difficulty level and symmetry.
   *
   * The givens are expected to be an array, each element represents a row.
   * Each row itself is an array, each element represents a cell in that row.
   * The cell value can be '1', '2', ..., '9', or empty ('').
   *
   * @param {enum} level Any, Easy, Medium, Hard, Expert
   * @param {enum} symmetry None, Rotate90, Rotate180, Mirror, Flip, Random
   * @return {array} the givens, wrapped in a Promise
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
   * Parse the Sudoku givens string into a 2-dimention character matrix (cell values are '' or '1'..'9').
   *
   * '1'..'9' indicates a non-empty value for a cell,
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
   * @param {string} puzzle the Sudoku givens in string
   * @return {array} a 2-dimention character matrix
   */
  function parse(puzzle) {
    // console.debug("[DEBUG] Calling parse(\n%s) ...", puzzle)

    const empty = new Set(['.', '0'])

    const result = Array(Config.scale)

    let index = 0, value, length = puzzle.length
    for(let rowIndex = 0; rowIndex < Config.scale; rowIndex++) {
      const row = Array(Config.scale)
      for(let colIndex = 0; colIndex < Config.scale; colIndex++) {
        do {
          if(index >= length) throw Error('Invalid puzzle input:\n' + puzzle)

          const char = puzzle[index++]
          value = empty.has(char) ? '' : Cell.CANDIDATES.has(char) ? char : undefined
        } while(value === undefined)
        row[colIndex] = value
      }
      result[rowIndex] = row
    }

    return result
  }

  return {
    EMPTY,
    FILLED,
    parse,
    get
  }
})()
