import {
  getPenIds,
  getRowPatterns,
  type PenBoard,
} from './board'

export type SolveOptions = {
  /**
   * Stop once this many solutions have been found. Always pass something sane: a degenerate board
   * (say ten pens that are each a whole row) has an enormous solution set, and the editor only ever
   * needs to know "one, or more than one".
   */
  limit?: number
  /** How many solutions to keep as witnesses. The generator needs two; validation needs none. */
  witnesses?: number
}

export type SolveResult = {
  /** Solutions found, never more than `limit`. */
  count: number
  /** True when the search stopped at `limit`, so the real count may be higher. */
  reachedLimit: boolean
  /** The first `witnesses` solutions, each as ascending cell indexes. */
  solutions: number[][]
}

const DEFAULT_LIMIT = 1000

/**
 * Counts the ways a board can legally be solved: `bullsPerGroup` bulls in every row, column and
 * pen, with no two bulls touching (including diagonally).
 *
 * This is the *only* solution counter in the project. It replaces one that hardcoded `1` for hard
 * and one that reported every solvable hard board as unsolvable, because its rollback could
 * decrement state it had never incremented.
 *
 * Cells with no pen (`0`) can never hold a bull — an unfinished board has no solutions rather than
 * a free-for-all.
 */
export function solveBoard(
  board: PenBoard,
  bullsPerGroup: number,
  options: SolveOptions = {},
): SolveResult {
  const limit = Math.max(1, options.limit ?? DEFAULT_LIMIT)
  const witnesses = Math.max(0, options.witnesses ?? 0)
  const { gridSize, pensByCell } = board

  if (gridSize <= 0 || pensByCell.length !== gridSize * gridSize) {
    return { count: 0, reachedLimit: false, solutions: [] }
  }

  const penIds = getPenIds(pensByCell)

  if (penIds.length === 0) {
    return { count: 0, reachedLimit: false, solutions: [] }
  }

  // Dense pen indexes so the hot loop can use plain arrays instead of a Map. -1 = cell has no pen.
  const penSlotById = new Map<number, number>()
  penIds.forEach((penId, slot) => penSlotById.set(penId, slot))
  const penSlotByCell = pensByCell.map((penId) => penSlotById.get(penId) ?? -1)

  const patterns = getRowPatterns(gridSize, bullsPerGroup)
  const columnCounts = new Array<number>(gridSize).fill(0)
  const penCounts = new Array<number>(penIds.length).fill(0)

  // Upper bound on the bulls each pen can still take from row r onward. Within one row a pen can
  // only hold as many bulls as it has mutually non-adjacent columns there.
  const penCapacityFromRow: number[][] = Array.from({ length: gridSize + 1 }, () =>
    new Array<number>(penIds.length).fill(0),
  )

  for (let row = gridSize - 1; row >= 0; row -= 1) {
    const columnsByPenSlot = new Map<number, number[]>()

    for (let column = 0; column < gridSize; column += 1) {
      const slot = penSlotByCell[row * gridSize + column]

      if (slot < 0) {
        continue
      }

      const columns = columnsByPenSlot.get(slot) ?? []
      columns.push(column)
      columnsByPenSlot.set(slot, columns)
    }

    for (let slot = 0; slot < penIds.length; slot += 1) {
      const columns = columnsByPenSlot.get(slot)
      let rowCapacity = 0

      if (columns) {
        let lastChosen = Number.NEGATIVE_INFINITY

        for (const column of columns) {
          if (column - lastChosen <= 1) {
            continue
          }

          rowCapacity += 1
          lastChosen = column
        }
      }

      penCapacityFromRow[row][slot] =
        Math.min(rowCapacity, bullsPerGroup) + penCapacityFromRow[row + 1][slot]
    }
  }

  const solutions: number[][] = []
  const chosenPatterns: number[][] = []
  let count = 0
  let reachedLimit = false

  function search(row: number, previousPattern: number[]) {
    if (count >= limit) {
      reachedLimit = true
      return
    }

    if (row === gridSize) {
      if (
        columnCounts.every((value) => value === bullsPerGroup) &&
        penCounts.every((value) => value === bullsPerGroup)
      ) {
        count += 1

        if (solutions.length < witnesses) {
          solutions.push(
            chosenPatterns.flatMap((pattern, patternRow) =>
              pattern.map((column) => patternRow * gridSize + column),
            ),
          )
        }
      }

      return
    }

    const rowsLeft = gridSize - row - 1

    for (const pattern of patterns) {
      if (count >= limit) {
        reachedLimit = true
        return
      }

      // Bulls in consecutive rows must not touch.
      let touchesPreviousRow = false

      for (const column of pattern) {
        for (const previousColumn of previousPattern) {
          if (Math.abs(column - previousColumn) <= 1) {
            touchesPreviousRow = true
            break
          }
        }

        if (touchesPreviousRow) {
          break
        }
      }

      if (touchesPreviousRow) {
        continue
      }

      // Apply the pattern, remembering exactly which columns were applied so the rollback below
      // can undo precisely that much when the pattern is rejected part way through.
      const appliedColumns: number[] = []
      let isPatternLegal = true

      for (const column of pattern) {
        const slot = penSlotByCell[row * gridSize + column]

        if (
          slot < 0 ||
          columnCounts[column] + 1 > bullsPerGroup ||
          penCounts[slot] + 1 > bullsPerGroup
        ) {
          isPatternLegal = false
          break
        }

        columnCounts[column] += 1
        penCounts[slot] += 1
        appliedColumns.push(column)
      }

      if (isPatternLegal) {
        const columnsStillReachable = columnCounts.every(
          (value) => value + rowsLeft >= bullsPerGroup,
        )
        const pensStillReachable = penCounts.every(
          (value, slot) => value + penCapacityFromRow[row + 1][slot] >= bullsPerGroup,
        )

        if (columnsStillReachable && pensStillReachable) {
          chosenPatterns.push(pattern)
          search(row + 1, pattern)
          chosenPatterns.pop()
        }
      }

      for (const column of appliedColumns) {
        const slot = penSlotByCell[row * gridSize + column]
        columnCounts[column] -= 1
        penCounts[slot] -= 1
      }
    }
  }

  search(0, [])

  return { count, reachedLimit, solutions }
}
