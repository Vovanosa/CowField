import type { LevelDraft } from '../types'
import {
  getBullsPerGroupForDifficulty,
  getGridSizeForDifficulty,
} from '../validation'

function shuffle<T>(items: T[]) {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]]
  }

  return nextItems
}

function buildSingleCowSeedColumns(gridSize: number) {
  const columns = Array.from({ length: gridSize }, (_, index) => index)
  const chosenColumns = Array.from({ length: gridSize }, () => -1)
  const usedColumns = new Set<number>()

  function search(rowIndex: number) {
    if (rowIndex === gridSize) {
      return true
    }

    const previousColumn = rowIndex > 0 ? chosenColumns[rowIndex - 1] : null
    const availableColumns = shuffle(
      columns.filter((column) => {
        if (usedColumns.has(column)) {
          return false
        }

        if (previousColumn !== null && Math.abs(column - previousColumn) <= 1) {
          return false
        }

        return true
      }),
    )

    for (const column of availableColumns) {
      chosenColumns[rowIndex] = column
      usedColumns.add(column)

      if (search(rowIndex + 1)) {
        return true
      }

      chosenColumns[rowIndex] = -1
      usedColumns.delete(column)
    }

    return false
  }

  return search(0) ? chosenColumns : null
}

export function generateLevelDraft(
  levelNumber: number,
  title: string,
  difficulty: LevelDraft['difficulty'],
) {
  const bullsPerGroup = getBullsPerGroupForDifficulty(difficulty)

  if (bullsPerGroup !== 1) {
    return null
  }

  const gridSize = getGridSizeForDifficulty(difficulty)
  const seedColumns = buildSingleCowSeedColumns(gridSize)

  if (!seedColumns) {
    return null
  }

  const pensByCell = Array.from({ length: gridSize * gridSize }, () => 0)
  const cowsByCell = Array.from({ length: gridSize * gridSize }, () => false)

  for (let row = 0; row < gridSize; row += 1) {
    const column = seedColumns[row]
    const cellIndex = row * gridSize + column
    pensByCell[cellIndex] = row + 1
    cowsByCell[cellIndex] = true
  }

  return {
    levelNumber,
    title,
    difficulty,
    gridSize,
    pensByCell,
    cowsByCell,
  } satisfies LevelDraft
}
