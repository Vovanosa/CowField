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
  /**
   * Stop after this many search nodes and report `truncated`. Unbounded when omitted.
   *
   * `limit` bounds the *answer*; this bounds the *work*, and they are not the same thing. Proving a
   * board has fewer than `limit` solutions means exhausting the search, so a board with one solution
   * is the most expensive board there is — measured on 15x15 with three bulls, finding merely the
   * first two solutions took **4 seconds** when the pens were row-shaped, and **1 millisecond** when
   * they were compact blocks. Cost tracks pen geometry, not board size, so no time budget expressed
   * in solutions can bound it.
   *
   * With a node budget a caller can say "spend at most this much effort" and get an honest answer
   * about whether it was enough.
   */
  maxNodes?: number
}

export type SolveResult = {
  /** Solutions found, never more than `limit`. */
  count: number
  /** True when the search stopped at `limit`, so the real count may be higher. */
  reachedLimit: boolean
  /** The first `witnesses` solutions, each as ascending cell indexes. */
  solutions: number[][]
  /**
   * True when the search ran out of `maxNodes` before finishing.
   *
   * **`count` is then a floor, not a total.** `count === 1 && truncated` means "no second solution
   * was found within the budget", which is weaker than "there is no second solution" — treat it as
   * unproven rather than unique.
   */
  truncated: boolean
}

const DEFAULT_LIMIT = 1000

/**
 * Row patterns in the form the hot loop wants: bitmasks, and the list of patterns that may follow
 * each one.
 *
 * Built once per `(gridSize, bullsPerGroup)` and cached, because it depends on nothing else — the
 * board's pens never enter into it. Three things it replaces, all of which were per-node work:
 *
 *  - **Adjacency.** Deciding whether a row touches the one above it was a nested loop over both
 *    patterns' columns, run for every candidate at every node. As masks it is one `&`: a pattern's
 *    `blockMask` is its columns smeared one to each side, so `mask & previousBlockMask` is the whole
 *    test. Better still, the answer does not depend on the board, so it is precomputed here into
 *    `compatible` and the loop never visits a touching pattern at all.
 *  - **Allocation.** `Int32Array` throughout, so walking candidates allocates nothing.
 *
 * This matters because the search is exponential and the constant factor is the only lever: at
 * 15x15 with three bulls there are 286 patterns per row over 15 rows, against 36 over 10 rows for
 * `hard`.
 */
type RowPatternIndex = {
  patterns: number[][]
  /** Every pattern index, for row 0, which has no row above it to be compatible with. */
  all: Int32Array
  /** For each pattern, the indexes of the patterns that may sit in the row directly below it. */
  compatible: Int32Array[]
}

const patternIndexCache = new Map<string, RowPatternIndex>()

function getRowPatternIndex(gridSize: number, bullsPerGroup: number): RowPatternIndex {
  const cacheKey = `${gridSize}:${bullsPerGroup}`
  const cached = patternIndexCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const patterns = getRowPatterns(gridSize, bullsPerGroup)
  const patternCount = patterns.length
  // Bit `c` is column `c`. Guarded rather than assumed: bitmasks are 32-bit, and the boards this
  // game ships are 6 to 15 wide.
  const boardMask = gridSize >= 31 ? 0x7fffffff : (1 << gridSize) - 1
  const masks = new Int32Array(patternCount)
  const blockMasks = new Int32Array(patternCount)

  for (let index = 0; index < patternCount; index += 1) {
    let mask = 0

    for (const column of patterns[index]) {
      mask |= 1 << column
    }

    masks[index] = mask
    // A bull blocks the cell below it and both diagonals, i.e. its column and the two beside it.
    blockMasks[index] = (mask | (mask << 1) | (mask >>> 1)) & boardMask
  }

  const compatible: Int32Array[] = new Array<Int32Array>(patternCount)
  const buffer = new Int32Array(patternCount)

  for (let index = 0; index < patternCount; index += 1) {
    const blocked = blockMasks[index]
    let size = 0

    for (let candidate = 0; candidate < patternCount; candidate += 1) {
      if ((masks[candidate] & blocked) === 0) {
        buffer[size] = candidate
        size += 1
      }
    }

    compatible[index] = buffer.slice(0, size)
  }

  const all = new Int32Array(patternCount)

  for (let index = 0; index < patternCount; index += 1) {
    all[index] = index
  }

  const built: RowPatternIndex = { patterns, all, compatible }
  patternIndexCache.set(cacheKey, built)

  return built
}

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
  const maxNodes = options.maxNodes && options.maxNodes > 0 ? options.maxNodes : Infinity
  const witnesses = Math.max(0, options.witnesses ?? 0)
  const { gridSize, pensByCell } = board

  if (gridSize <= 0 || pensByCell.length !== gridSize * gridSize) {
    return { count: 0, reachedLimit: false, solutions: [], truncated: false }
  }

  const penIds = getPenIds(pensByCell)

  if (penIds.length === 0) {
    return { count: 0, reachedLimit: false, solutions: [], truncated: false }
  }

  // Dense pen indexes so the hot loop can use plain arrays instead of a Map. -1 = cell has no pen.
  const penSlotById = new Map<number, number>()
  penIds.forEach((penId, slot) => penSlotById.set(penId, slot))
  const penSlotByCell = pensByCell.map((penId) => penSlotById.get(penId) ?? -1)

  const { patterns, all: allPatternIndexes, compatible } = getRowPatternIndex(
    gridSize,
    bullsPerGroup,
  )
  const patternCount = patterns.length
  const penCount = penIds.length
  const columnCounts = new Int32Array(gridSize)
  const penCounts = new Int32Array(penCount)

  /*
    Which pen each bull of each pattern would land in, flattened to one array and computed once.

    The search used to read `penSlotByCell[row * gridSize + column]` for every bull of every
    candidate at every node, and again on rollback. It depends only on the row and the pattern, so
    it is hoisted: `penSlotByRowPattern[(row * patternCount + pattern) * bullsPerGroup + k]` is the
    pen of the pattern's k-th bull. `patternUsable` is 0 where a pattern covers a cell with no pen —
    an unfinished board — which the search would otherwise have to discover per node.

    One flat allocation rather than a nested array: this runs on every `solveBoard` call, and the
    generator makes thousands of them per board.
  */
  const penSlotByRowPattern = new Int32Array(gridSize * patternCount * bullsPerGroup)
  const patternUsable = new Uint8Array(gridSize * patternCount)

  for (let row = 0; row < gridSize; row += 1) {
    const rowOffset = row * gridSize

    for (let index = 0; index < patternCount; index += 1) {
      const columns = patterns[index]
      const base = (row * patternCount + index) * bullsPerGroup
      let usable = 1

      for (let k = 0; k < bullsPerGroup; k += 1) {
        const slot = penSlotByCell[rowOffset + columns[k]]

        if (slot < 0) {
          usable = 0
          break
        }

        penSlotByRowPattern[base + k] = slot
      }

      patternUsable[row * patternCount + index] = usable
    }
  }

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
  /** The pattern index chosen for each row so far — an index, not the array it names. */
  const chosenPatterns = new Int32Array(gridSize)
  let count = 0
  let reachedLimit = false
  let truncated = false
  let nodes = 0

  /**
   * `previousPatternIndex` is -1 on the first row, which has no row above it to touch.
   *
   * The candidate list is the pruning: `compatible[previousPatternIndex]` already excludes every
   * pattern that would touch the row above, so the adjacency test that used to run per node is
   * gone entirely rather than merely made cheaper.
   */
  function search(row: number, previousPatternIndex: number) {
    if (count >= limit) {
      reachedLimit = true
      return
    }

    nodes += 1

    if (nodes >= maxNodes) {
      truncated = true
      return
    }

    if (row === gridSize) {
      for (let column = 0; column < gridSize; column += 1) {
        if (columnCounts[column] !== bullsPerGroup) {
          return
        }
      }

      for (let slot = 0; slot < penCount; slot += 1) {
        if (penCounts[slot] !== bullsPerGroup) {
          return
        }
      }

      count += 1

      if (solutions.length < witnesses) {
        const cells: number[] = []

        for (let solutionRow = 0; solutionRow < gridSize; solutionRow += 1) {
          const columns = patterns[chosenPatterns[solutionRow]]

          for (let k = 0; k < bullsPerGroup; k += 1) {
            cells.push(solutionRow * gridSize + columns[k])
          }
        }

        solutions.push(cells)
      }

      return
    }

    const rowsLeft = gridSize - row - 1
    const candidates = previousPatternIndex < 0 ? allPatternIndexes : compatible[previousPatternIndex]
    const usableOffset = row * patternCount
    const capacityBelow = penCapacityFromRow[row + 1]

    for (let candidate = 0; candidate < candidates.length; candidate += 1) {
      if (count >= limit) {
        reachedLimit = true
        return
      }

      // Unwind the whole search, not just this node, once the budget is gone.
      if (truncated) {
        return
      }

      const patternIndex = candidates[candidate]

      if (patternUsable[usableOffset + patternIndex] === 0) {
        continue
      }

      const columns = patterns[patternIndex]
      const base = (usableOffset + patternIndex) * bullsPerGroup

      // Apply, counting exactly how many bulls went on so a partial application rolls back by
      // precisely that much.
      let applied = 0
      let isPatternLegal = true

      for (let k = 0; k < bullsPerGroup; k += 1) {
        const column = columns[k]
        const slot = penSlotByRowPattern[base + k]

        if (columnCounts[column] + 1 > bullsPerGroup || penCounts[slot] + 1 > bullsPerGroup) {
          isPatternLegal = false
          break
        }

        columnCounts[column] += 1
        penCounts[slot] += 1
        applied += 1
      }

      if (isPatternLegal) {
        let stillReachable = true

        for (let column = 0; column < gridSize; column += 1) {
          if (columnCounts[column] + rowsLeft < bullsPerGroup) {
            stillReachable = false
            break
          }
        }

        if (stillReachable) {
          for (let slot = 0; slot < penCount; slot += 1) {
            if (penCounts[slot] + capacityBelow[slot] < bullsPerGroup) {
              stillReachable = false
              break
            }
          }
        }

        if (stillReachable) {
          chosenPatterns[row] = patternIndex
          search(row + 1, patternIndex)
        }
      }

      for (let k = 0; k < applied; k += 1) {
        columnCounts[columns[k]] -= 1
        penCounts[penSlotByRowPattern[base + k]] -= 1
      }
    }
  }

  search(0, -1)

  return { count, reachedLimit, solutions, truncated }
}
