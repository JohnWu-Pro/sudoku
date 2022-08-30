'use strict';

window.Grid = window.Grid ?? (() => {
  const LETTERS = 'ABCDEFGHIJKLMOPQ'

  const ROWS = Array(CONFIG.scale).fill(0).map((_, i) => 1+i)
  const COLUMNS = Array(CONFIG.scale).fill(0).map((_, i) => LETTERS.substring(i,i+1))

  const HOUSES = {
    row: {},       // rowId:   [keys in row]
    column: {},    // colId:   [keys in column]
    box: {}        // boxKey:  [keys in box]
  }
  const PEERS = {} // cell-key: {peer keys set}

  function init() {
    ROWS.forEach(rowId => HOUSES.row[rowId] = COLUMNS.map(colId => keyOf(rowId, colId)))

    COLUMNS.forEach(colId => HOUSES.column[colId] = ROWS.map(rowId => keyOf(rowId, colId)))

    for(let topRowId = 1; topRowId <= CONFIG.scale; topRowId += CONFIG.box) {
      for(let leftCol = 0; leftCol < CONFIG.scale; leftCol += CONFIG.box) {
        const keys = []
        for(let rowId = topRowId; rowId < topRowId+CONFIG.box; rowId++) {
          for(const colId of LETTERS.substring(leftCol, leftCol + CONFIG.box)) {
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
    const leftCol = Math.floor(LETTERS.indexOf(colId) / CONFIG.box) * CONFIG.box
    const topRowId = Math.floor((rowId - 1) / CONFIG.box) * CONFIG.box + 1
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
