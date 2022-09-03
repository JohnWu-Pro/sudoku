'use strict';

window.Grid = window.Grid ?? (() => {
  const LETTERS = 'ABCDEFGHIJKLMOPQ'

  const ROWS = Array(Config.scale).fill(0).map((_, i) => 1+i)
  const COLUMNS = Array(Config.scale).fill(0).map((_, i) => LETTERS.substring(i,i+1))

  const HOUSES = {
    row: {},       // rowId:   [keys in row]
    column: {},    // colId:   [keys in column]
    box: {}        // boxKey:  [keys in box]
  }
  const PEERS = {} // cell-key: {peer keys set}

  function init() {
    ROWS.forEach(rowId => HOUSES.row[rowId] = COLUMNS.map(colId => keyOf(rowId, colId)))

    COLUMNS.forEach(colId => HOUSES.column[colId] = ROWS.map(rowId => keyOf(rowId, colId)))

    for(let topRowId = 1; topRowId <= Config.scale; topRowId += Config.box) {
      for(let leftCol = 0; leftCol < Config.scale; leftCol += Config.box) {
        const keys = []
        for(let rowId = topRowId; rowId < topRowId+Config.box; rowId++) {
          for(const colId of LETTERS.substring(leftCol, leftCol + Config.box)) {
            keys.push(keyOf(rowId, colId))
          }
        }
        HOUSES.box[keyOf(topRowId, LETTERS.substring(leftCol, leftCol + 1))] = keys
      }
    }

    ROWS.forEach(rowId => {
      COLUMNS.forEach(colId => {
        PEERS[keyOf(rowId, colId)] = new Set([
          ...HOUSES.row[rowId],
          ...HOUSES.column[colId],
          ...HOUSES.box[boxKeyOf(rowId, colId)]
        ])
      })
    })
    // console.debug("[DEBUG] Peers: %o", PEERS)
    // console.debug("[DEBUG] keys: %o", keys())
  }

  function keys() {
    return Object.keys(PEERS)
  }

  function houses(key) {
    const {rowId, colId} = idsFrom(key)
    return {
      row: HOUSES.row[rowId],
      column: HOUSES.column[colId],
      box: HOUSES.box[boxKeyOf(rowId, colId)]
    }
  }

  function peers(key) {
    return PEERS[key]
  }

  function keyOf(rowId, colId) {
    return colId + rowId
  }

  function boxKeyOf(rowId, colId) {
    const leftCol = Math.floor(LETTERS.indexOf(colId) / Config.box) * Config.box
    const topRowId = Math.floor((rowId - 1) / Config.box) * Config.box + 1
    return keyOf(topRowId, LETTERS.substring(leftCol, leftCol + 1))
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

    keys,
    houses,
    peers,

    keyOf,
    boxKeyOf,
    idsFrom,
  }
})()
