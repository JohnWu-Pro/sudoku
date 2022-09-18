'use strict';

window.Grid = window.Grid ?? (() => {
  const LETTERS = 'ABCDEFGHIJKLMOPQ'

  const ROWS = Object.freeze(Array(Config.scale).fill(0).map((_, i) => 1+i))
  const COLUMNS = Object.freeze(Array(Config.scale).fill(0).map((_, i) => LETTERS[i]))

  const HOUSES = new Map([
    ['rows', new Map()],     // rowId:   [keys in row]
    ['columns', new Map()],  // colId:   [keys in column]
    ['boxes', new Map()]     // boxKey:  [keys in box]
  ])
  const PEERS = {} // cell-key: {peer keys set}

  function init() {
    const rows = HOUSES.get('rows')
    ROWS.forEach(rowId => rows.set(rowId, COLUMNS.map(colId => keyOf(rowId, colId))))

    const columns = HOUSES.get('columns')
    COLUMNS.forEach(colId => columns.set(colId, ROWS.map(rowId => keyOf(rowId, colId))))

    const boxes = HOUSES.get('boxes')
    for(let topRowId = 1; topRowId <= Config.scale; topRowId += Config.box) {
      for(let leftCol = 0; leftCol < Config.scale; leftCol += Config.box) {
        const keys = []
        for(let rowId = topRowId; rowId < topRowId+Config.box; rowId++) {
          for(const colId of LETTERS.substring(leftCol, leftCol + Config.box)) {
            keys.push(keyOf(rowId, colId))
          }
        }
        boxes.set(keyOf(topRowId, LETTERS[leftCol]), keys)
      }
    }

    ROWS.forEach(rowId => {
      COLUMNS.forEach(colId => {
        PEERS[keyOf(rowId, colId)] = new Set([
          ...rows.get(rowId),
          ...columns.get(colId),
          ...boxes.get(boxKeyOf(rowId, colId))
        ])
      })
    })

    Object.freeze(HOUSES)
    Object.freeze(PEERS)
  }

  function keys() {
    return Object.keys(PEERS)
  }

  function houses(key) {
    const {rowId, colId} = idsFrom(key)
    return new Map([
      ['row', HOUSES.get('rows').get(rowId)],
      ['column', HOUSES.get('columns').get(colId)],
      ['box', HOUSES.get('boxes').get(boxKeyOf(rowId, colId))]
    ])
  }

  function peers(key) {
    return PEERS[key]
  }

  function keyOf(rowId, colId) {
    return colId + rowId
  }

  /**
   * @param {number} rowId
   * @param {char} colId
   * OR
   * @param {string} key
   */
  function boxKeyOf() {
    let rowId, colId
    if(arguments.length === 1) {
      ({rowId, colId} = idsFrom(arguments[0]))
    } else if(arguments.length === 2) {
      [rowId, colId] = arguments
    } else {
      throw Error(`Invalid arguments: ${arguments}`)
    }
    const leftCol = Math.floor(LETTERS.indexOf(colId) / Config.box) * Config.box
    const topRowId = Math.floor((rowId - 1) / Config.box) * Config.box + 1
    return keyOf(topRowId, LETTERS[leftCol])
  }

  function idsFrom(key) {
    const [matched, colId, rowId] = key?.match(/^([A-Z])(\d+)$/) ?? []
    return matched ? ({rowId: Number(rowId), colId}) : ({})
  }

  //
  // Initialize
  //
  init()

  return {
    ROWS,
    COLUMNS,
    HOUSES,

    keys,
    houses,
    peers,

    keyOf,
    boxKeyOf,
    idsFrom,
  }
})()
