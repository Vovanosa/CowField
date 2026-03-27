import type { LevelDraft } from '../types'
import {
  getBullsPerGroupForDifficulty,
  getGridSizeForDifficulty,
  validateLevelDraft,
} from '../validation'
import { generateHardLevelDraft } from './hardGenerator'

function shuffle<T>(items: T[]) {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]]
  }

  return nextItems
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getOrthogonalNeighbors(index: number, gridSize: number) {
  const row = Math.floor(index / gridSize)
  const column = index % gridSize
  const neighbors: number[] = []

  if (row > 0) {
    neighbors.push(index - gridSize)
  }
  if (row < gridSize - 1) {
    neighbors.push(index + gridSize)
  }
  if (column > 0) {
    neighbors.push(index - 1)
  }
  if (column < gridSize - 1) {
    neighbors.push(index + 1)
  }

  return neighbors
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

function getFrontierCells(
  pensByCell: number[],
  penId: number,
  gridSize: number,
) {
  const frontier = new Set<number>()

  pensByCell.forEach((currentPenId, cellIndex) => {
    if (currentPenId !== penId) {
      return
    }

    for (const neighbor of getOrthogonalNeighbors(cellIndex, gridSize)) {
      if (pensByCell[neighbor] === 0) {
        frontier.add(neighbor)
      }
    }
  })

  return Array.from(frontier)
}

function buildCompletePensFromSeeds(
  seedColumns: number[],
  gridSize: number,
) {
  const totalCells = gridSize * gridSize
  const pensByCell = Array.from({ length: totalCells }, () => 0)
  const cowsByCell = Array.from({ length: totalCells }, () => false)
  const shuffledPenIds = shuffle(
    Array.from({ length: gridSize }, (_, index) => index + 1),
  )
  const bullCellsByPen = new Map<number, number>()
  const penSizes = new Map<number, number>()
  const maxPenSize = Math.max(gridSize + 2, 4 * gridSize - 8)
  const maxBurst = Math.max(1, gridSize - 2)

  for (let row = 0; row < gridSize; row += 1) {
    const column = seedColumns[row]
    const cellIndex = row * gridSize + column
    const penId = shuffledPenIds[row]
    pensByCell[cellIndex] = penId
    cowsByCell[cellIndex] = true
    bullCellsByPen.set(penId, cellIndex)
    penSizes.set(penId, 1)
  }

  let emptyCount = totalCells - gridSize
  let idleRounds = 0

  while (emptyCount > 0 && idleRounds < totalCells * 3) {
    const growablePenIds = shuffledPenIds.filter((penId) => {
      const frontier = getFrontierCells(pensByCell, penId, gridSize)
      return frontier.length > 0 && (penSizes.get(penId) ?? 0) < maxPenSize
    })

    if (growablePenIds.length === 0) {
      break
    }

    const penId = growablePenIds[randomInt(0, growablePenIds.length - 1)]
    const burstLength = randomInt(1, maxBurst)
    let placedDuringBurst = 0

    for (let step = 0; step < burstLength; step += 1) {
      if ((penSizes.get(penId) ?? 0) >= maxPenSize) {
        break
      }

      const frontier = shuffle(getFrontierCells(pensByCell, penId, gridSize)).sort((left, right) => {
        const leftEmptyNeighbors = getOrthogonalNeighbors(left, gridSize)
          .filter((neighbor) => pensByCell[neighbor] === 0).length
        const rightEmptyNeighbors = getOrthogonalNeighbors(right, gridSize)
          .filter((neighbor) => pensByCell[neighbor] === 0).length
        const leftDistance =
          Math.abs(Math.floor(left / gridSize) - Math.floor((bullCellsByPen.get(penId) ?? left) / gridSize)) +
          Math.abs((left % gridSize) - ((bullCellsByPen.get(penId) ?? left) % gridSize))
        const rightDistance =
          Math.abs(Math.floor(right / gridSize) - Math.floor((bullCellsByPen.get(penId) ?? right) / gridSize)) +
          Math.abs((right % gridSize) - ((bullCellsByPen.get(penId) ?? right) % gridSize))

        if (rightEmptyNeighbors !== leftEmptyNeighbors) {
          return rightEmptyNeighbors - leftEmptyNeighbors
        }

        return leftDistance - rightDistance
      })

      const nextCell = frontier[0]

      if (nextCell === undefined) {
        break
      }

      pensByCell[nextCell] = penId
      penSizes.set(penId, (penSizes.get(penId) ?? 0) + 1)
      emptyCount -= 1
      placedDuringBurst += 1

      if (emptyCount === 0) {
        break
      }
    }

    idleRounds = placedDuringBurst === 0 ? idleRounds + 1 : 0
  }

  while (emptyCount > 0) {
    const emptyCells = pensByCell
      .map((penId, cellIndex) => ({ penId, cellIndex }))
      .filter((entry) => entry.penId === 0)
      .map((entry) => entry.cellIndex)

    const nextCell = emptyCells[randomInt(0, emptyCells.length - 1)]
    const neighboringPenIds = shuffle(
      Array.from(
        new Set(
          getOrthogonalNeighbors(nextCell, gridSize)
            .map((neighbor) => pensByCell[neighbor])
            .filter((penId) => penId > 0),
        ),
      ),
    ).sort((left, right) => (penSizes.get(left) ?? 0) - (penSizes.get(right) ?? 0))

    const chosenPenId = neighboringPenIds[0]

    if (chosenPenId === undefined) {
      return null
    }

    pensByCell[nextCell] = chosenPenId
    penSizes.set(chosenPenId, (penSizes.get(chosenPenId) ?? 0) + 1)
    emptyCount -= 1
  }

  return {
    pensByCell,
    cowsByCell,
  }
}

export function generateLevelDraft(
  levelNumber: number,
  title: string,
  difficulty: LevelDraft['difficulty'],
) {
  const bullsPerGroup = getBullsPerGroupForDifficulty(difficulty)

  if (difficulty === 'hard') {
    return generateHardLevelDraft(levelNumber, title)
  }

  if (bullsPerGroup !== 1) {
    return null
  }

  const gridSize = getGridSizeForDifficulty(difficulty)
  const maxAttempts = 200

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const seedColumns = buildSingleCowSeedColumns(gridSize)

    if (!seedColumns) {
      continue
    }

    const completedPens = buildCompletePensFromSeeds(seedColumns, gridSize)

    if (!completedPens) {
      continue
    }

    const draft = {
      levelNumber,
      title,
      difficulty,
      gridSize,
      pensByCell: completedPens.pensByCell,
      cowsByCell: completedPens.cowsByCell,
    } satisfies LevelDraft

    const validationResult = validateLevelDraft(draft)

    if (validationResult.isValid) {
      return draft
    }
  }

  return null
}
