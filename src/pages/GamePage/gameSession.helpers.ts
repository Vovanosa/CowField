import type { MutableRefObject } from 'react'

import { getBullsPerGroupForDifficulty } from '../../game/validation'
import type { CellMark, Difficulty, LevelDefinition } from '../../game/types'

// `export type { CellMark } from '...'` alone re-exports without binding the name locally, so every
// use of `CellMark` below was unresolved. Import it, then re-export for `useGameSession`.
export type { CellMark }
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

/**
 * The cells that provably cannot hold a bull, given the bulls already on the board.
 *
 * Two independent reasons a cell is ruled out, and the difference between them is what makes this
 * work on `hard`:
 *
 * 1. **It touches a bull.** Always true — bulls may never touch, in any of the 8 directions, at any
 *    difficulty.
 * 2. **Its row, column or pen already holds the full quota.** Only true once that group has
 *    `bullsPerGroup` bulls in it.
 *
 * `hard` needs **two** bulls per group, so one bull does *not* close its row — the player still has
 * a second to place there. The original version dotted the whole row, column and pen off a single
 * bull, which is correct only at a quota of 1, and that is why the feature was switched off for
 * `hard` instead of adapted. Counting per group covers both cases with one rule: at a quota of 1 the
 * first bull immediately fills its groups, reproducing the old behaviour exactly.
 */
function getAutoDotIndexes(level: LevelDefinition, bullIndexes: number[]) {
  const autoDotIndexes = new Set<number>()
  const bullsPerGroup = getBullsPerGroupForDifficulty(level.difficulty)
  const rowCounts = Array.from({ length: level.gridSize }, () => 0)
  const columnCounts = Array.from({ length: level.gridSize }, () => 0)
  const penCounts = new Map<number, number>()

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const penId = level.pensByCell[bullIndex]

    rowCounts[row] += 1
    columnCounts[column] += 1
    penCounts.set(penId, (penCounts.get(penId) ?? 0) + 1)

    // Reason 1: no bull may touch another, so every neighbour is out immediately.
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
  }

  // Reason 2: a full group takes nothing more. `>=` rather than `===` so an over-filled row (the
  // player is allowed to place invalid bulls) still reads as closed instead of silently reopening.
  for (let index = 0; index < level.pensByCell.length; index += 1) {
    const row = Math.floor(index / level.gridSize)
    const column = index % level.gridSize
    const penId = level.pensByCell[index]

    if (
      rowCounts[row] >= bullsPerGroup ||
      columnCounts[column] >= bullsPerGroup ||
      (penCounts.get(penId) ?? 0) >= bullsPerGroup
    ) {
      autoDotIndexes.add(index)
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
