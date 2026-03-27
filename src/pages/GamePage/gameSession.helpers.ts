import type { MutableRefObject } from 'react'

import { getBullsPerGroupForDifficulty } from '../../game/validation'
import type { Difficulty, LevelDefinition } from '../../game/types'

export type CellMark = 'empty' | 'dot' | 'bull'
export type DragMode = 'add-dot' | 'clear-dot' | null

export type GameDragState = {
  isMouseDown: boolean
  startIndex: number | null
  startMark: CellMark | null
  dragMode: DragMode
  dragged: boolean
  visited: Set<number>
  historyRecorded: boolean
}

export function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

export function getBullIndexes(marks: CellMark[]) {
  return marks
    .map((mark, index) => ({ mark, index }))
    .filter((entry) => entry.mark === 'bull')
    .map((entry) => entry.index)
}

function getAutoDotIndexes(level: LevelDefinition, bullIndexes: number[]) {
  const autoDotIndexes = new Set<number>()

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue
        }

        const nextRow = row + rowOffset
        const nextColumn = column + columnOffset

        if (
          nextRow < 0 ||
          nextRow >= level.gridSize ||
          nextColumn < 0 ||
          nextColumn >= level.gridSize
        ) {
          continue
        }

        autoDotIndexes.add(nextRow * level.gridSize + nextColumn)
      }
    }

    for (let nextColumn = 0; nextColumn < level.gridSize; nextColumn += 1) {
      if (nextColumn !== column) {
        autoDotIndexes.add(row * level.gridSize + nextColumn)
      }
    }

    for (let nextRow = 0; nextRow < level.gridSize; nextRow += 1) {
      if (nextRow !== row) {
        autoDotIndexes.add(nextRow * level.gridSize + column)
      }
    }

    for (let index = 0; index < level.pensByCell.length; index += 1) {
      if (level.pensByCell[index] === colorId && index !== bullIndex) {
        autoDotIndexes.add(index)
      }
    }
  }

  return autoDotIndexes
}

export function applyAutoPlacedDots(
  level: LevelDefinition,
  previousMarks: CellMark[],
  draftNextMarks: CellMark[],
) {
  const previousAutoDots = getAutoDotIndexes(level, getBullIndexes(previousMarks))
  const nextBullIndexes = getBullIndexes(draftNextMarks)
  const nextAutoDots = getAutoDotIndexes(level, nextBullIndexes)
  const manualDots = new Set<number>()

  for (let index = 0; index < draftNextMarks.length; index += 1) {
    if (draftNextMarks[index] !== 'dot') {
      continue
    }

    const wasPreviousManualDot = previousMarks[index] === 'dot' && !previousAutoDots.has(index)

    if (wasPreviousManualDot || previousMarks[index] === 'empty') {
      manualDots.add(index)
    }
  }

  return draftNextMarks.map((mark, index) => {
    if (mark === 'bull') {
      return 'bull'
    }

    if (nextAutoDots.has(index) || manualDots.has(index)) {
      return 'dot'
    }

    return 'empty'
  })
}

export function getSolutionState(level: LevelDefinition, marks: CellMark[]) {
  const bullsPerGroup = getBullsPerGroupForDifficulty(level.difficulty)
  const bullIndexes = getBullIndexes(marks)
  const requiredBullCount = bullsPerGroup * level.gridSize
  const invalidBullIndexes = new Set<number>()
  const rowCounts = Array.from({ length: level.gridSize }, () => 0)
  const columnCounts = Array.from({ length: level.gridSize }, () => 0)
  const colorCounts = new Map<number, number>()
  const bullSet = new Set(bullIndexes)

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    rowCounts[row] += 1
    columnCounts[column] += 1
    colorCounts.set(colorId, (colorCounts.get(colorId) ?? 0) + 1)
  }

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    if (
      rowCounts[row] > bullsPerGroup ||
      columnCounts[column] > bullsPerGroup ||
      (colorCounts.get(colorId) ?? 0) > bullsPerGroup
    ) {
      invalidBullIndexes.add(bullIndex)
    }

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue
        }

        const nextRow = row + rowOffset
        const nextColumn = column + columnOffset

        if (
          nextRow < 0 ||
          nextRow >= level.gridSize ||
          nextColumn < 0 ||
          nextColumn >= level.gridSize
        ) {
          continue
        }

        const neighborIndex = nextRow * level.gridSize + nextColumn

        if (bullSet.has(neighborIndex)) {
          invalidBullIndexes.add(bullIndex)
          invalidBullIndexes.add(neighborIndex)
        }
      }
    }
  }

  return {
    requiredBullCount,
    bullIndexes,
    invalidBullIndexes,
    isSolved: bullIndexes.length === requiredBullCount && invalidBullIndexes.size === 0,
  }
}

export function createEmptyBoard(level: LevelDefinition) {
  return Array.from({ length: level.gridSize * level.gridSize }, () => 'empty' as const)
}

export function createGameDragState(): GameDragState {
  return {
    isMouseDown: false,
    startIndex: null,
    startMark: null,
    dragMode: null,
    dragged: false,
    visited: new Set<number>(),
    historyRecorded: false,
  }
}

export function resetGameDragState(dragStateRef: MutableRefObject<GameDragState>) {
  dragStateRef.current = createGameDragState()
}

export function getInteractionTimestamp(timeStamp: number) {
  return performance.timeOrigin + timeStamp
}
