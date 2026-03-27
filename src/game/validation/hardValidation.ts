import type { LevelDraft } from '../types'

function getCellRow(index: number, gridSize: number) {
  return Math.floor(index / gridSize)
}

function getCellColumn(index: number, gridSize: number) {
  return index % gridSize
}

function areCellsTouching(left: number, right: number, gridSize: number) {
  return (
    Math.abs(getCellRow(left, gridSize) - getCellRow(right, gridSize)) <= 1 &&
    Math.abs(getCellColumn(left, gridSize) - getCellColumn(right, gridSize)) <= 1
  )
}

function getMaxRowPenCapacity(columns: number[]) {
  if (columns.length === 0) {
    return 0
  }

  const sortedColumns = [...columns].sort((left, right) => left - right)
  let capacity = 0
  let lastChosenColumn = Number.NEGATIVE_INFINITY

  for (const column of sortedColumns) {
    if (column - lastChosenColumn <= 1) {
      continue
    }

    capacity += 1
    lastChosenColumn = column
  }

  return capacity
}

function buildHardRowPatterns(gridSize: number) {
  const patterns: number[][] = []

  for (let firstColumn = 0; firstColumn < gridSize; firstColumn += 1) {
    for (let secondColumn = firstColumn + 2; secondColumn < gridSize; secondColumn += 1) {
      patterns.push([firstColumn, secondColumn])
    }
  }

  return patterns
}

function buildRemainingPenCapacityByRow(draft: LevelDraft) {
  const penIds = Array.from(new Set(draft.pensByCell)).filter((penId) => penId > 0)
  const perRowPenCapacity = Array.from({ length: draft.gridSize }, () => new Map<number, number>())

  for (let row = 0; row < draft.gridSize; row += 1) {
    const columnsByPen = new Map<number, number[]>()

    for (let column = 0; column < draft.gridSize; column += 1) {
      const cellIndex = row * draft.gridSize + column
      const penId = draft.pensByCell[cellIndex]

      if (penId <= 0) {
        continue
      }

      const columns = columnsByPen.get(penId) ?? []
      columns.push(column)
      columnsByPen.set(penId, columns)
    }

    for (const penId of penIds) {
      perRowPenCapacity[row].set(
        penId,
        getMaxRowPenCapacity(columnsByPen.get(penId) ?? []),
      )
    }
  }

  const remainingCapacityByRow = Array.from(
    { length: draft.gridSize + 1 },
    () => new Map<number, number>(),
  )

  for (const penId of penIds) {
    remainingCapacityByRow[draft.gridSize].set(penId, 0)
  }

  for (let row = draft.gridSize - 1; row >= 0; row -= 1) {
    for (const penId of penIds) {
      remainingCapacityByRow[row].set(
        penId,
        (perRowPenCapacity[row].get(penId) ?? 0) +
          (remainingCapacityByRow[row + 1].get(penId) ?? 0),
      )
    }
  }

  return {
    penIds,
    remainingCapacityByRow,
  }
}

export function getHardValidationIssues(draft: LevelDraft) {
  const issues: string[] = []
  const distinctPenIds = Array.from(new Set(draft.pensByCell)).filter((penId) => penId > 0)

  for (const penId of distinctPenIds) {
    const cells = draft.pensByCell
      .map((value, index) => ({ value, index }))
      .filter((entry) => entry.value === penId)
      .map((entry) => entry.index)

    let hasNonTouchingPair = false

    for (let leftIndex = 0; leftIndex < cells.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < cells.length; rightIndex += 1) {
        if (!areCellsTouching(cells[leftIndex], cells[rightIndex], draft.gridSize)) {
          hasNonTouchingPair = true
          break
        }
      }

      if (hasNonTouchingPair) {
        break
      }
    }

    if (!hasNonTouchingPair) {
      issues.push(
        `Pen ${penId} must contain at least one non-touching bull pair for hard difficulty.`,
      )
    }
  }

  return issues
}

export function countHardLevelSolutions(draft: LevelDraft) {
  const gridSize = draft.gridSize
  const bullsPerGroup = 2
  const rowPatterns = buildHardRowPatterns(gridSize)
  const columnCounts = Array.from({ length: gridSize }, () => 0)
  const penCounts = new Map<number, number>()
  const { penIds, remainingCapacityByRow } = buildRemainingPenCapacityByRow(draft)

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
      const pensValid = Array.from(penCounts.values()).every((count) => count === bullsPerGroup)

      if (columnsValid && pensValid) {
        solutions += 1
      }

      return
    }

    const remainingRows = gridSize - rowIndex - 1

    for (const pattern of rowPatterns) {
      const touchesPreviousRow = pattern.some((column) =>
        previousPattern.some((previousColumn) => Math.abs(column - previousColumn) <= 1),
      )

      if (touchesPreviousRow) {
        continue
      }

      const touchedPens = new Map<number, number>()
      let invalidPattern = false

      for (const column of pattern) {
        const cellIndex = rowIndex * gridSize + column
        const penId = draft.pensByCell[cellIndex]
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
          (count) => count <= bullsPerGroup && count + remainingRows * bullsPerGroup >= bullsPerGroup,
        )
        const pensStillPossible = penIds.every((penId) => {
          const count = penCounts.get(penId) ?? 0
          const remainingCapacity = remainingCapacityByRow[rowIndex + 1].get(penId) ?? 0

          return count <= bullsPerGroup && count + remainingCapacity >= bullsPerGroup
        })

        if (columnsStillPossible && pensStillPossible) {
          search(rowIndex + 1, pattern)
        }
      }

      for (const column of pattern) {
        const cellIndex = rowIndex * gridSize + column
        const penId = draft.pensByCell[cellIndex]

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
