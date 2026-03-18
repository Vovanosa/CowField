import type { Difficulty, LevelDraft } from '../types'

export type LevelValidationResult = {
  isValid: boolean
  issues: string[]
  solutionCount: number | null
  bullsPerGroup: number
  distinctPenCount: number
}

export function getBullsPerGroupForDifficulty(difficulty: Difficulty) {
  return difficulty === 'hard' ? 2 : 1
}

export function getGridSizeForDifficulty(difficulty: Difficulty) {
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

function isConnectedPen(cells: number[], gridSize: number) {
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

function buildRowPatterns(gridSize: number, bullsPerGroup: number): number[][] {
  const patterns: number[][] = []

  function backtrack(startColumn: number, current: number[]) {
    if (current.length === bullsPerGroup) {
      patterns.push([...current])
      return
    }

    for (let column = startColumn; column < gridSize; column += 1) {
      const previous = current[current.length - 1]
      if (previous !== undefined && column - previous <= 1) {
        continue
      }

      current.push(column)
      backtrack(column + 1, current)
      current.pop()
    }
  }

  backtrack(0, [])
  return patterns
}

function countLevelSolutions(draft: LevelDraft, bullsPerGroup: number) {
  const { gridSize, pensByCell } = draft
  const patterns = buildRowPatterns(gridSize, bullsPerGroup)
  const columnCounts = Array.from({ length: gridSize }, () => 0)
  const penCounts = new Map<number, number>()
  const penIds = Array.from(new Set(pensByCell)).filter((penId) => penId > 0)

  for (const penId of penIds) {
    penCounts.set(penId, 0)
  }

  let solutions = 0

  function search(rowIndex: number, previousPattern: number[]) {
    if (solutions > 1) {
      return
    }

    if (rowIndex === gridSize) {
      const columnsValid = columnCounts.every((count) => count === bullsPerGroup)
      const pensValid = Array.from(penCounts.values()).every(
        (count) => count === bullsPerGroup,
      )

      if (columnsValid && pensValid) {
        solutions += 1
      }
      return
    }

    const remainingRows = gridSize - rowIndex - 1

    for (const pattern of patterns) {
      let blockedByAdjacency = false

      for (const column of pattern) {
        for (const previousColumn of previousPattern) {
          if (Math.abs(column - previousColumn) <= 1) {
            blockedByAdjacency = true
            break
          }
        }

        if (blockedByAdjacency) {
          break
        }
      }

      if (blockedByAdjacency) {
        continue
      }

      const touchedPens = new Map<number, number>()
      let invalidPattern = false

      for (const column of pattern) {
        const cellIndex = rowIndex * gridSize + column
        const penId = pensByCell[cellIndex]
        const nextColumnCount = columnCounts[column] + 1
        const nextPenCount = (penCounts.get(penId) ?? 0) + 1

        if (nextColumnCount > bullsPerGroup || nextPenCount > bullsPerGroup) {
          invalidPattern = true
          break
        }

        columnCounts[column] = nextColumnCount
        penCounts.set(penId, nextPenCount)
        touchedPens.set(penId, nextPenCount)
      }

      if (!invalidPattern) {
        const columnsStillPossible = columnCounts.every(
          (count) => count <= bullsPerGroup && count + remainingRows >= bullsPerGroup,
        )

        if (columnsStillPossible) {
          search(rowIndex + 1, pattern)
        }
      }

      for (const column of pattern) {
        const cellIndex = rowIndex * gridSize + column
        const penId = pensByCell[cellIndex]

        if (!touchedPens.has(penId)) {
          continue
        }

        columnCounts[column] -= 1
        penCounts.set(penId, (penCounts.get(penId) ?? 1) - 1)
      }
    }
  }

  search(0, [])

  return solutions
}

export function validateLevelDraft(draft: LevelDraft): LevelValidationResult {
  const bullsPerGroup = getBullsPerGroupForDifficulty(draft.difficulty)
  const issues: string[] = []
  const expectedGridSize = getGridSizeForDifficulty(draft.difficulty)

  if (!draft.title.trim()) {
    issues.push('Add a level title.')
  }

  if (draft.gridSize !== expectedGridSize) {
    issues.push(`Grid size must stay ${expectedGridSize} x ${expectedGridSize} for ${draft.difficulty}.`)
  }

  if (draft.pensByCell.length !== draft.gridSize * draft.gridSize) {
    issues.push('The pen grid is incomplete.')
  }

  const distinctPenIds = Array.from(new Set(draft.pensByCell)).filter((penId) => penId > 0)

  if (draft.pensByCell.some((penId) => penId === 0)) {
    issues.push('Every cell must belong to a pen.')
  }

  if (distinctPenIds.length !== draft.gridSize) {
    issues.push(`A ${draft.gridSize} x ${draft.gridSize} level must use exactly ${draft.gridSize} pens.`)
  }

  for (const penId of distinctPenIds) {
    const cells = draft.pensByCell
      .map((value, index) => ({ value, index }))
      .filter((entry) => entry.value === penId)
      .map((entry) => entry.index)

    if (cells.length < bullsPerGroup) {
      issues.push(`Pen ${penId} is too small for ${bullsPerGroup} bull placements.`)
    }

    if (!isConnectedPen(cells, draft.gridSize)) {
      issues.push(`Pen ${penId} must be one connected polyomino.`)
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      issues,
      solutionCount: null,
      bullsPerGroup,
      distinctPenCount: distinctPenIds.length,
    }
  }

  const solutionCount = countLevelSolutions(draft, bullsPerGroup)

  if (solutionCount === 0) {
    issues.push('This level has no valid solution.')
  }

  return {
    isValid: issues.length === 0,
    issues,
    solutionCount,
    bullsPerGroup,
    distinctPenCount: distinctPenIds.length,
  }
}
