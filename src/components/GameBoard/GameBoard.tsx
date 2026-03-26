import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { getColorForId, getGapColorForId } from '../../game/levels'
import type { LevelDefinition } from '../../game/types'
import './GameBoard.css'

type CellMark = 'empty' | 'dot' | 'bull'

type GameBoardProps = {
  level: LevelDefinition
  cellMarks: readonly CellMark[]
  invalidBullIndexes: ReadonlySet<number>
  isBoardLocked: boolean
  activeCellIndex?: number | null
  onCellPointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) => void
  onCellPointerEnter: (
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) => void
  onCellPointerUp: (
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) => void
}

function CowMarker() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="play-cow-marker"
      focusable="false"
    >
      <path
        d="M8 10 5.5 5.8l5 2.4L12.6 7h6.8l2.1 1.2 5-2.4L24 10v8.2A4.8 4.8 0 0 1 19.2 23H12.8A4.8 4.8 0 0 1 8 18.2Z"
        fill="var(--color-cow-fill)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12.2" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <circle cx="19.8" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <path
        d="M12.2 18.4h7.6a2.8 2.8 0 0 1-2.8 3h-2a2.8 2.8 0 0 1-2.8-3Z"
        fill="var(--color-cow-accent)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="14.4" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
      <circle cx="17.6" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
    </svg>
  )
}

function getCellBorderStyle(level: LevelDefinition, cellIndex: number) {
  const { gridSize, pensByCell } = level
  const colorId = pensByCell[cellIndex]
  const row = Math.floor(cellIndex / gridSize)
  const column = cellIndex % gridSize
  const internalBorderColor = 'var(--color-board-region-divider)'
  const sameColorGapColor = getGapColorForId(colorId)

  const rightNeighbor = column < gridSize - 1 ? pensByCell[cellIndex + 1] : null
  const bottomNeighbor = row < gridSize - 1 ? pensByCell[cellIndex + gridSize] : null

  return {
    boxShadow: [
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
      .join(', '),
  }
}

function getCellStyle(
  level: LevelDefinition,
  cellIndex: number,
  isInvalid: boolean,
  isActive: boolean,
) {
  const borderStyle = getCellBorderStyle(level, cellIndex)

  return {
    backgroundColor: getColorForId(level.pensByCell[cellIndex]),
    boxShadow: [
      isActive ? 'inset 0 0 0 2px var(--color-board-active-ring)' : null,
      isActive ? 'inset 0 0 0 999px var(--color-board-active-overlay)' : null,
      isInvalid ? 'inset 0 0 0 3px var(--color-board-invalid-ring)' : null,
      isInvalid ? 'inset 0 0 0 999px var(--color-board-invalid-overlay)' : null,
      borderStyle.boxShadow || null,
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

  return hasDarkGap
    ? 'var(--color-board-region-divider)'
    : getGapColorForId(topLeft)
}

function getIntersectionStyle(
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

export function GameBoard({
  level,
  cellMarks,
  invalidBullIndexes,
  isBoardLocked,
  activeCellIndex = null,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp,
}: GameBoardProps) {
  return (
    <div className="board-preview" aria-label="Puzzle board">
      <div
        className="board-preview-grid"
        style={{ gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))` }}
      >
        {level.pensByCell.map((_, index) => {
          const isInvalid = invalidBullIndexes.has(index)
          const isActive = activeCellIndex === index

          return (
            <button
              key={index}
              type="button"
              className={[
                'board-cell',
                isInvalid ? 'board-cell-invalid' : '',
                isActive ? 'board-cell-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={getCellStyle(level, index, isInvalid, isActive)}
              onPointerDown={(event) => onCellPointerDown(event, index)}
              onPointerEnter={(event) => onCellPointerEnter(event, index)}
              onPointerUp={(event) => onCellPointerUp(event, index)}
              onDragStart={(event) => event.preventDefault()}
              disabled={isBoardLocked}
            >
              {cellMarks[index] === 'dot' ? <span className="board-cell-dot" /> : null}
              {cellMarks[index] === 'bull' ? <CowMarker /> : null}
            </button>
          )
        })}

        {Array.from({ length: Math.max(level.gridSize - 1, 0) }, (_, rowIndex) =>
          Array.from({ length: Math.max(level.gridSize - 1, 0) }, (_, columnIndex) => (
            <span
              key={`intersection-${rowIndex + 1}-${columnIndex + 1}`}
              className="board-grid-intersection"
              style={getIntersectionStyle(level, rowIndex + 1, columnIndex + 1)}
              aria-hidden="true"
            />
          )),
        )}
      </div>
    </div>
  )
}
