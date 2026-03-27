import type { CSSProperties } from 'react'

import { getColorForId, getGapColorForId } from '../../game/levels'
import type { LevelDefinition } from '../../game/types'

function getCellBorderShadow(level: LevelDefinition, cellIndex: number) {
  const { gridSize, pensByCell } = level
  const colorId = pensByCell[cellIndex]
  const row = Math.floor(cellIndex / gridSize)
  const column = cellIndex % gridSize
  const internalBorderColor = 'var(--color-board-region-divider)'
  const sameColorGapColor = getGapColorForId(colorId)

  const rightNeighbor = column < gridSize - 1 ? pensByCell[cellIndex + 1] : null
  const bottomNeighbor = row < gridSize - 1 ? pensByCell[cellIndex + gridSize] : null

  return [
    rightNeighbor !== null && rightNeighbor !== colorId
      ? `2px 0 0 ${internalBorderColor}`
      : rightNeighbor !== null
        ? `2px 0 0 ${sameColorGapColor}`
        : null,
    bottomNeighbor !== null && bottomNeighbor !== colorId
      ? `0 2px 0 ${internalBorderColor}`
      : bottomNeighbor !== null
        ? `0 2px 0 ${sameColorGapColor}`
        : null,
  ]
    .filter(Boolean)
    .join(', ')
}

export function getBoardCellStyle(
  level: LevelDefinition,
  cellIndex: number,
  isInvalid: boolean,
  isActive: boolean,
): CSSProperties {
  return {
    backgroundColor: getColorForId(level.pensByCell[cellIndex]),
    boxShadow: [
      isActive ? 'inset 0 0 0 2px var(--color-board-active-ring)' : null,
      isActive ? 'inset 0 0 0 999px var(--color-board-active-overlay)' : null,
      isInvalid ? 'inset 0 0 0 3px var(--color-board-invalid-ring)' : null,
      isInvalid ? 'inset 0 0 0 999px var(--color-board-invalid-overlay)' : null,
      getCellBorderShadow(level, cellIndex) || null,
    ]
      .filter(Boolean)
      .join(', '),
  }
}

function getIntersectionColor(level: LevelDefinition, row: number, column: number) {
  const { gridSize, pensByCell } = level
  const topLeft = pensByCell[(row - 1) * gridSize + (column - 1)]
  const topRight = pensByCell[(row - 1) * gridSize + column]
  const bottomLeft = pensByCell[row * gridSize + (column - 1)]
  const bottomRight = pensByCell[row * gridSize + column]

  const hasDarkGap =
    topLeft !== topRight ||
    topLeft !== bottomLeft ||
    topRight !== bottomRight ||
    bottomLeft !== bottomRight

  return hasDarkGap ? 'var(--color-board-region-divider)' : getGapColorForId(topLeft)
}

export function getBoardIntersectionStyle(
  level: LevelDefinition,
  row: number,
  column: number,
): CSSProperties {
  const gapSizePx = 2
  const totalGapPx = (level.gridSize - 1) * gapSizePx
  const cellTrack = `(100% - ${totalGapPx}px) / ${level.gridSize}`
  const left = `calc(${column} * (${cellTrack}) + ${(column - 1) * gapSizePx}px)`
  const top = `calc(${row} * (${cellTrack}) + ${(row - 1) * gapSizePx}px)`

  return {
    left,
    top,
    backgroundColor: getIntersectionColor(level, row, column),
  }
}
