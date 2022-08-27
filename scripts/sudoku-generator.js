'use strict';

/**
 * A JavaScript port based on "Solving Every Sudoku Puzzle" by Peter Norvig.
 *
 * The article can be found here:
 * - http://norvig.com/sudoku.html
 *
 * The original Python source can be found here:
 * - https://github.com/norvig/pytudes/blob/master/sudoku.py
 *
 * The original JavaScript port source can be found here:
 * - https://github.com/tshrestha/js-sudoku
 */
window.Generator = window.Generator ?? (() => {

  const Levels = {
    easy: 17,
    medium: 31,
    hard: 43,
    master: 61
  };

  //
  // Utility functions
  //
  const rows = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
  const cols = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  // const lowerCaseRows = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);

  function getRows() {
    return rows;
  }

  // function getLowerCaseRows() {
  //   return lowerCaseRows;
  // }

  function getCols() {
    return cols
  }

  function getSquares() {
    return cross(rows, cols);
  }

  function getUnitList() {
    return [...cols].map(c => cross(rows, new Set(c)))
        .concat([...rows].map(r => cross(new Set(r), cols)))
        .concat((() => {
          let u = [];
          [['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I']].forEach(r => {
            [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].forEach(c => {
              u.push(cross(new Set(r), new Set(c)))
            })
          });

          return u;
        })());
  }

  function getUnits(squares, unitlist) {
    let units = new Map();
    [...squares].forEach(s => units.set(s, unitlist.filter(u => u.has(s))));

    return units;
  }

  function getPeers(squares, units) {
    let peers = new Map();

    [...squares].forEach(s => {
      let p = units.get(s);
      peers.set(s, new Set(
          [...new Set([...p[0], ...p[1], ...p[2]])].filter(x => x !== s)));
    });

    return peers;
  }

  function cross(a, b) {
    let c = new Set();

    for (let a1 of a.values()) {
      for (let b1 of b.values() || b) {
        c.add(a1 + b1);
      }
    }

    return c;
  }

  function some(seq, func) {
    for (let d of seq) {
      let result = func(d);
      if (result) return result;
    }

    return false;
  }

  /**
   * Fisher-Yates Shuffle
   * See http://bit.ly/2gMXijX
   */
  function shuffle(seq) {
    let array = [...seq];
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  function all(values) {
    for (let v of values)
      if (!v) return false;

    return true;
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  //
  // Generator functions
  //
  const digits = getCols();
  const squares = getSquares();
  const unitlist = getUnitList();

  let units = getUnits(squares, unitlist);
  let peers = getPeers(squares, units);

  /**
   * Convert grid to a dict of possible values, {square: digits},
   * or return false if a contradiction is detected.
   */
  function parseGrid(grid) {
    let values = new Map();
    squares.forEach(s => values.set(s, digits));

    for (let [s, d] of gridValues(grid).entries()) {
      if (digits.has(d) && !assign(values, s, d)) {
        return false;
      }
    }

    return values;
  }

  /**
   * Convert grid into a dict of {square: char} with '0' or '.' for empties.
   */
  function gridValues(grid) {
    let chars = grid.filter(c => digits.has(c) || c === '0' || c === '.');
    let values = new Map();
    let s = [...squares];

    for (let i = 0; i < s.length; i++) {
      values.set(s[i], chars[i]);
    }

    return values;
  }

  /**
   * Eliminate all the other values (except d) from values[s] and propagate.
   * Return values, except return False if a contradiction is detected.
   */
  function assign(values, s, d) {
    let others = [...values.get(s)].filter(x => x !== d);
    return all(others.map(d2 => eliminate(values, s, d2))) ? values : false;
  }

  /**
   * Eliminate d from values[s]; propagate when values or places <= 2.
   * Return values, except return False if a contradiction is detected.
   */
  function eliminate(values, s, d) {
    if (!values.get(s).has(d))
      return values;

    values.set(s, new Set([...values.get(s)].filter(x => x !== d)));

    if (!values.get(s).size) {
      return false;

    } else if (values.get(s).size === 1) {
      let d2 = [...values.get(s)][0];

      if (!all([...peers.get(s)].map(s2 => eliminate(values, s2, d2))))
        return false;
    }

    for (let unit of units.get(s)) {
      let dplaces = [...unit].filter(s2 => values.get(s2).has(d));

      if (!dplaces.length) {
        return false;
      } else if (dplaces.length === 1) {
        if (!assign(values, dplaces[0], d))
          return false;
      }
    }

    return values;
  }

  function solve(grid) {
    return search(parseGrid(grid));
  }

  /**
   * Using depth-first search and propagation, try all possible values.
   */
  function search(values) {
    if (!values)
      return false;

    if (all([...squares].map(s => values.get(s).size === 1)))
      return values;

    let s = [...squares]
        .filter(s => values.get(s).size > 1)
        .sort((s1, s2) => values.get(s1).size - values.get(s2).size)[0];

    return some(values.get(s), d => search(assign(new Map(values), s, d)));
  }

  /**
   * A puzzle is solved if each unit is a permutation of the digits 1 to 9.
   */
  function solved(values) {
    function unitSolved(unit) {
      for (let s of unit) {
        let diff = [...values.get(s)].filter(d => !digits.has(d));
        if (diff.length > 0) return false;
      }

      return true;
    }

    return values && all(unitlist.map(u => unitSolved(u)));
  }

  /**
   * Make a random puzzle with N or more assignments. Restart on contradictions.
   * Note the resulting puzzle is not guaranteed to be solvable, but empirically
   * about 99.8% of them are solvable. Some have multiple solutions
   */
  function randomPuzzle(n = 17) {
    let values = new Map();
    squares.forEach(s => values.set(s, digits));

    for (let s of shuffle(squares)) {
      if (!assign(values, s, randomValue(values.get(s)))) {
        break;
      }

      let ds = [...squares]
          .filter(s => values.get(s).size === 1)
          .map(s => values.get(s));

      if (ds.length >= n && new Set(ds).size >= 8) {
        return [...squares]
            .map(s => values.get(s).size === 1 ? [...values.get(s)][0] : '0');
      }
    }

    return randomPuzzle(n);
  }

  function randomValue(values) {
    return [...values][getRandomInt(0, values.size - 1)];
  }

  function isUnique(original, test) {
    for (let [s, d] of original) {
      if ([...test.get(s)][0] !== [...d][0]) return false;
    }

    return true;
  }

  /**
   * Iterate through the randomly shuffled squares.
   * After removing each square from the solution
   * solve it and test if it is the same as the original.
   * If the solution doesn't match undo the removal and
   * try another square.
   */
  function createPuzzle(solution) {
    let puzzle = [];
    let indices = {};
    let shuffled = shuffle(squares);

    [...squares].forEach((s, i) => {
      puzzle.push([...solution.get(s)][0]);
      indices[s] = i;
    });

    let result = new Map();

    for (let i = 0; i < shuffled.length; i++) {
      let j = indices[shuffled[i]];
      let v = puzzle[j];
      puzzle[j] = '0';

      if (!isUnique(solution, solve(puzzle))) {
        puzzle[j] = v;
        result.set(shuffled[i], Number(v));
      } else {
        result.set(shuffled[i], 0);
      }
    }

    return result;
  }

  function generate(difficulty = Levels.easy) {
    console.debug("[DEBUG] difficulty: %o", difficulty)
    let solution = solve(randomPuzzle(81 - difficulty));

    while (!solved(solution)) {
      solution = solve(randomPuzzle(81 - difficulty));
    }

    console.debug("[DEBUG] solution: %o", solution)
    return {
      puzzle: createPuzzle(solution),
      solution: solution
    };
  }

  //
  // Exports
  //
  return {
    Levels,
    generate
  }

})()
