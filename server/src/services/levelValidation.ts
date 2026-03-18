import type { Difficulty } from '../types/level'
import type { LevelRecordInput } from '../schemas/levelSchemas'

type ValidationResult = {
  isValid: boolean
  issues: string[]
}

function getGridSizeForDifficulty(difficulty: Difficulty) {
  switch (difficulty) {
    case 'light':
      return 6
    case 'easy':
      return 8
    case 'medium':
    case 'hard':
      return 10
    default:
      return 10
  }
}

function getCowsPerGroupForDifficulty(difficulty: Difficulty) {
  return difficulty === 'hard' ? 2 : 1
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

function isConnectedColor(cells: number[], gridSize: number) {
  if (cells.length === 0) {
    return false
  }

  const remaining = new Set(cells)
  const queue = [cells[0]]
  remaining.delete(cells[0])

  while (queue.length > 0) {
    const current = queue.shift()

    if (current === undefined) {
      continue
    }

    for (const neighbor of getOrthogonalNeighbors(current, gridSize)) {
      if (!remaining.has(neighbor)) {
        continue
      }

      remaining.delete(neighbor)
      queue.push(neighbor)
    }
  }

  return remaining.size === 0
}

function countCowsByGroup(input: LevelRecordInput) {
  const rowCounts = Array.from({ length: input.gridSize }, () => 0)
  const columnCounts = Array.from({ length: input.gridSize }, () => 0)
  const colorCounts = new Map<number, number>()
  const cowIndexes = input.cowsByCell
    .map((isCow, index) => ({ isCow, index }))
    .filter((entry) => entry.isCow)
    .map((entry) => entry.index)

  for (const cowIndex of cowIndexes) {
    const row = Math.floor(cowIndex / input.gridSize)
    const column = cowIndex % input.gridSize
    const color = input.colorsByCell[cowIndex]

    rowCounts[row] += 1
    columnCounts[column] += 1
    colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1)
  }

  return { rowCounts, columnCounts, colorCounts, cowIndexes }
}

function hasNeighborConflict(cowIndexes: number[], gridSize: number) {
  const cowSet = new Set(cowIndexes)

  for (const cowIndex of cowIndexes) {
    const row = Math.floor(cowIndex / gridSize)
    const column = cowIndex % gridSize

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue
        }

        const nextRow = row + rowOffset
        const nextColumn = column + columnOffset

        if (
          nextRow < 0 ||
          nextRow >= gridSize ||
          nextColumn < 0 ||
          nextColumn >= gridSize
        ) {
          continue
        }

        if (cowSet.has(nextRow * gridSize + nextColumn)) {
          return true
        }
      }
    }
  }

  return false
}

export function validateLevelRecord(input: LevelRecordInput): ValidationResult {
  const issues: string[] = []
  const expectedGridSize = getGridSizeForDifficulty(input.difficulty)
  const cowsPerGroup = getCowsPerGroupForDifficulty(input.difficulty)
  const totalCells = input.gridSize * input.gridSize

  if (input.gridSize !== expectedGridSize) {
    issues.push(
      `Grid size must be ${expectedGridSize} x ${expectedGridSize} for ${input.difficulty}.`,
    )
  }

  if (input.colorsByCell.length !== totalCells) {
    issues.push('colorsByCell length does not match the grid size.')
  }

  if (input.cowsByCell.length !== totalCells) {
    issues.push('cowsByCell length does not match the grid size.')
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      issues,
    }
  }

  if (input.colorsByCell.some((color) => color === 0)) {
    issues.push('Every cell must belong to a color.')
  }

  const distinctColorIds = Array.from(new Set(input.colorsByCell)).filter((color) => color > 0)

  if (distinctColorIds.length !== input.gridSize) {
    issues.push(`A ${input.gridSize} x ${input.gridSize} level must use exactly ${input.gridSize} colors.`)
  }

  for (const colorId of distinctColorIds) {
    const cells = input.colorsByCell
      .map((value, index) => ({ value, index }))
      .filter((entry) => entry.value === colorId)
      .map((entry) => entry.index)

    if (cells.length < cowsPerGroup) {
      issues.push(`Color ${colorId} is too small for ${cowsPerGroup} cow placements.`)
    }

    if (!isConnectedColor(cells, input.gridSize)) {
      issues.push(`Color ${colorId} must form one connected region.`)
    }
  }

  const { rowCounts, columnCounts, colorCounts, cowIndexes } = countCowsByGroup(input)
  const expectedCowCount = cowsPerGroup * input.gridSize

  if (cowIndexes.length !== expectedCowCount) {
    issues.push(`This difficulty requires exactly ${expectedCowCount} cows.`)
  }

  if (rowCounts.some((count) => count !== cowsPerGroup)) {
    issues.push(`Each row must contain exactly ${cowsPerGroup} cow${cowsPerGroup > 1 ? 's' : ''}.`)
  }

  if (columnCounts.some((count) => count !== cowsPerGroup)) {
    issues.push(`Each column must contain exactly ${cowsPerGroup} cow${cowsPerGroup > 1 ? 's' : ''}.`)
  }

  for (const colorId of distinctColorIds) {
    const cowCount = colorCounts.get(colorId) ?? 0

    if (cowCount !== cowsPerGroup) {
      issues.push(`Color ${colorId} must contain exactly ${cowsPerGroup} cow${cowsPerGroup > 1 ? 's' : ''}.`)
    }
  }

  if (hasNeighborConflict(cowIndexes, input.gridSize)) {
    issues.push('Cows cannot be in neighboring cells, including diagonals.')
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}
