import {
  getBullsPerGroupForDifficulty,
  getCellColumn,
  getCellRow,
  getGridSizeForDifficulty,
  getOrthogonalNeighbors,
  getRowPatterns,
  isConnectedRegion,
  type Difficulty,
} from './board'
import { solveBoard } from './solver'

export type GenerateBoardOptions = {
  /** How many times to start over from a fresh bull layout before giving up. */
  attempts?: number
  /** Repair steps allowed per attempt. */
  stepBudget?: number
  /** Wall-clock ceiling for the whole call. */
  timeBudgetMs?: number
  /** Injectable for reproducible runs; defaults to `Math.random`. */
  random?: () => number
  now?: () => number
}

export type GeneratedBoard = {
  gridSize: number
  pensByCell: number[]
  bullsByCell: boolean[]
  /** Always 1 — a board is only returned once it is uniquely solvable. */
  solutionCount: number
  attempts: number
  elapsedMs: number
}

/**
 * Counting ceiling used as the search objective. It has to be far above the starting count or the
 * objective saturates and the descent is blind: freshly grown 10x10 boards start in the thousands.
 */
const OBJECTIVE_LIMIT = 40000

/** Candidate moves scored per repair step. More is better but each one costs a solve. */
const MOVES_PER_STEP = 20

const DEFAULTS = {
  attempts: 40,
  stepBudget: 150,
  timeBudgetMs: 6000,
}

/**
 * Builds a level whose puzzle has exactly ONE solution.
 *
 * Random boards essentially never qualify: measured over 300 drafts each, the previous generator
 * produced a unique solution 10% of the time on light, 1% on easy and 0% on medium and hard. Two
 * things fix that, and both matter:
 *
 * 1. **Snake-shaped pens.** Compact blobs leave the puzzle enormous freedom — a 10x10 blob board
 *    has a median of ~11,500 solutions. Growing each pen along the most enclosed frontier cell
 *    instead produces long, interlocking pens with a median of ~158.
 * 2. **A repair loop.** With the intended solution held fixed, find an alternative solution and
 *    move one cell it depends on into a pen that already has its quota in that alternative. That
 *    kills the alternative without disturbing the intended solution. Repeat until unique.
 *
 * Returns `null` if the attempt or time budget runs out, which the caller should treat as
 * "try again" rather than "impossible".
 */
export function generateUniqueBoard(
  difficulty: Difficulty,
  options: GenerateBoardOptions = {},
): GeneratedBoard | null {
  const gridSize = getGridSizeForDifficulty(difficulty)
  const bullsPerGroup = getBullsPerGroupForDifficulty(difficulty)
  const random = options.random ?? Math.random
  const now = options.now ?? (() => Date.now())
  const attempts = Math.max(1, options.attempts ?? DEFAULTS.attempts)
  const stepBudget = Math.max(1, options.stepBudget ?? DEFAULTS.stepBudget)
  const startedAt = now()
  const deadline = startedAt + Math.max(1, options.timeBudgetMs ?? DEFAULTS.timeBudgetMs)

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (now() >= deadline) {
      return null
    }

    const bullCells = pickBullLayout(gridSize, bullsPerGroup, random)

    if (!bullCells) {
      continue
    }

    const pensByCell = growSnakePens(bullCells, gridSize, bullsPerGroup, random)

    if (!pensByCell) {
      continue
    }

    const solutionCount = repairUniqueness({
      pensByCell,
      bullCells,
      gridSize,
      bullsPerGroup,
      stepBudget,
      random,
      now,
      deadline,
    })

    if (solutionCount !== 1) {
      continue
    }

    const bullsByCell = new Array<boolean>(gridSize * gridSize).fill(false)
    for (const cell of bullCells) {
      bullsByCell[cell] = true
    }

    return {
      gridSize,
      pensByCell,
      bullsByCell,
      solutionCount: 1,
      attempts: attempt,
      elapsedMs: now() - startedAt,
    }
  }

  return null
}

function shuffle<T>(items: T[], random: () => number) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const held = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = held
  }

  return next
}

/** A random legal bull layout: `bullsPerGroup` per row and column, none touching. */
function pickBullLayout(gridSize: number, bullsPerGroup: number, random: () => number) {
  const patterns = getRowPatterns(gridSize, bullsPerGroup)
  const columnCounts = new Array<number>(gridSize).fill(0)
  const chosen: number[][] = []

  function search(row: number, previousPattern: number[]): boolean {
    if (row === gridSize) {
      return columnCounts.every((count) => count === bullsPerGroup)
    }

    for (const pattern of shuffle(patterns, random)) {
      if (pattern.some((column) => previousPattern.some((prev) => Math.abs(column - prev) <= 1))) {
        continue
      }

      if (pattern.some((column) => columnCounts[column] + 1 > bullsPerGroup)) {
        continue
      }

      for (const column of pattern) {
        columnCounts[column] += 1
      }
      chosen.push(pattern)

      if (search(row + 1, pattern)) {
        return true
      }

      chosen.pop()
      for (const column of pattern) {
        columnCounts[column] -= 1
      }
    }

    return false
  }

  if (!search(0, [])) {
    return null
  }

  return chosen.flatMap((pattern, row) => pattern.map((column) => row * gridSize + column))
}

/**
 * Grows `gridSize` connected pens that each own exactly `bullsPerGroup` of the given bulls.
 *
 * The shape matters more than anything else here (see `generateUniqueBoard`): each pen is extended
 * into whichever frontier cell has the FEWEST free neighbours, which snakes it along walls and
 * around other pens rather than fattening it into a disc.
 */
function growSnakePens(
  bullCells: number[],
  gridSize: number,
  bullsPerGroup: number,
  random: () => number,
) {
  const totalCells = gridSize * gridSize
  const pensByCell = new Array<number>(totalCells).fill(0)
  const penSizes = new Array<number>(gridSize + 1).fill(0)

  if (bullsPerGroup === 1) {
    shuffle(bullCells, random).forEach((cell, index) => {
      pensByCell[cell] = index + 1
      penSizes[index + 1] = 1
    })
  } else if (!seedMultiBullPens(bullCells, pensByCell, penSizes, gridSize, random)) {
    return null
  }

  let assignedCells = pensByCell.reduce((total, penId) => (penId > 0 ? total + 1 : total), 0)

  for (const penId of shuffle(
    Array.from({ length: gridSize }, (_, index) => index + 1),
    random,
  )) {
    // Aim for uneven pen sizes; identical sizes make the board look mechanical.
    const wantedSize = penSizes[penId] + 1 + Math.floor(random() * (2 * gridSize - 2))

    while (penSizes[penId] < wantedSize && assignedCells < totalCells) {
      let bestCell = -1
      let bestFreeNeighbors = Number.POSITIVE_INFINITY

      for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
        if (pensByCell[cellIndex] !== penId) {
          continue
        }

        for (const neighbor of getOrthogonalNeighbors(cellIndex, gridSize)) {
          if (pensByCell[neighbor] !== 0) {
            continue
          }

          const freeNeighbors = getOrthogonalNeighbors(neighbor, gridSize).filter(
            (candidate) => pensByCell[candidate] === 0,
          ).length

          if (freeNeighbors < bestFreeNeighbors) {
            bestFreeNeighbors = freeNeighbors
            bestCell = neighbor
          }
        }
      }

      if (bestCell < 0) {
        break
      }

      pensByCell[bestCell] = penId
      penSizes[penId] += 1
      assignedCells += 1
    }
  }

  // Anything the snakes walked past joins the smallest pen touching it.
  let guard = 0

  while (assignedCells < totalCells && guard < totalCells * 4) {
    guard += 1

    for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
      if (pensByCell[cellIndex] !== 0) {
        continue
      }

      const neighborPens = Array.from(
        new Set(
          getOrthogonalNeighbors(cellIndex, gridSize)
            .map((neighbor) => pensByCell[neighbor])
            .filter((penId) => penId > 0),
        ),
      ).sort((left, right) => penSizes[left] - penSizes[right])

      if (neighborPens.length === 0) {
        continue
      }

      pensByCell[cellIndex] = neighborPens[0]
      penSizes[neighborPens[0]] += 1
      assignedCells += 1
    }
  }

  if (assignedCells < totalCells) {
    return null
  }

  for (let penId = 1; penId <= gridSize; penId += 1) {
    if (!isConnectedRegion(getCellsOfPen(pensByCell, penId), gridSize)) {
      return null
    }
  }

  if (!pensOwnExactBulls(pensByCell, bullCells, gridSize, bullsPerGroup)) {
    return null
  }

  return pensByCell
}

/**
 * For two-bull difficulties each pen needs two of the bulls, and it has to be able to reach both.
 * Pairs every bull with its nearest unpaired partner and carves an L-shaped corridor between them.
 */
function seedMultiBullPens(
  bullCells: number[],
  pensByCell: number[],
  penSizes: number[],
  gridSize: number,
  random: () => number,
) {
  const pool = shuffle(bullCells, random)
  let penId = 1

  while (pool.length > 1 && penId <= gridSize) {
    const seed = pool.shift() as number
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < pool.length; index += 1) {
      const distance =
        Math.abs(getCellRow(pool[index], gridSize) - getCellRow(seed, gridSize)) +
        Math.abs(getCellColumn(pool[index], gridSize) - getCellColumn(seed, gridSize))

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    }

    const mate = pool.splice(nearestIndex, 1)[0]
    pensByCell[seed] = penId
    pensByCell[mate] = penId
    penSizes[penId] = 2

    let row = getCellRow(seed, gridSize)
    let column = getCellColumn(seed, gridSize)
    const mateRow = getCellRow(mate, gridSize)
    const mateColumn = getCellColumn(mate, gridSize)
    let guard = 0

    while ((row !== mateRow || column !== mateColumn) && guard < 4 * gridSize) {
      guard += 1

      if (row !== mateRow) {
        row += row < mateRow ? 1 : -1
      } else {
        column += column < mateColumn ? 1 : -1
      }

      const cellIndex = row * gridSize + column

      if (cellIndex === mate) {
        break
      }

      if (pensByCell[cellIndex] === 0) {
        pensByCell[cellIndex] = penId
        penSizes[penId] += 1
      } else if (pensByCell[cellIndex] !== penId) {
        // The corridor is blocked by another pen, so this pairing cannot be connected.
        return false
      }
    }

    penId += 1
  }

  return pool.length === 0
}

function getCellsOfPen(pensByCell: number[], penId: number) {
  const cells: number[] = []

  for (let cellIndex = 0; cellIndex < pensByCell.length; cellIndex += 1) {
    if (pensByCell[cellIndex] === penId) {
      cells.push(cellIndex)
    }
  }

  return cells
}

/** The invariant the repair loop must never break: the intended solution stays a solution. */
function pensOwnExactBulls(
  pensByCell: number[],
  bullCells: number[],
  gridSize: number,
  bullsPerGroup: number,
) {
  const counts = new Array<number>(gridSize + 1).fill(0)

  for (const cell of bullCells) {
    const penId = pensByCell[cell]

    if (penId < 1 || penId > gridSize) {
      return false
    }

    counts[penId] += 1
  }

  for (let penId = 1; penId <= gridSize; penId += 1) {
    if (counts[penId] !== bullsPerGroup) {
      return false
    }
  }

  return true
}

type PenMove = {
  cell: number
  to: number
}

/** Every single-cell pen reassignment that keeps all the structural invariants intact. */
function collectLegalMoves(
  pensByCell: number[],
  bullCells: number[],
  bullCellSet: Set<number>,
  gridSize: number,
  bullsPerGroup: number,
  candidateCells: number[],
) {
  const moves: PenMove[] = []

  for (const cell of candidateCells) {
    // Moving a bull's own cell would change which pen owns it.
    if (bullCellSet.has(cell)) {
      continue
    }

    const from = pensByCell[cell]

    if (from <= 0) {
      continue
    }

    const targets = Array.from(
      new Set(
        getOrthogonalNeighbors(cell, gridSize)
          .map((neighbor) => pensByCell[neighbor])
          .filter((penId) => penId > 0 && penId !== from),
      ),
    )

    for (const to of targets) {
      pensByCell[cell] = to

      const fromCells = getCellsOfPen(pensByCell, from)
      const isLegal =
        fromCells.length >= bullsPerGroup &&
        isConnectedRegion(fromCells, gridSize) &&
        isConnectedRegion(getCellsOfPen(pensByCell, to), gridSize) &&
        pensOwnExactBulls(pensByCell, bullCells, gridSize, bullsPerGroup)

      pensByCell[cell] = from

      if (isLegal) {
        moves.push({ cell, to })
      }
    }
  }

  return moves
}

type RepairArgs = {
  pensByCell: number[]
  bullCells: number[]
  gridSize: number
  bullsPerGroup: number
  stepBudget: number
  random: () => number
  now: () => number
  deadline: number
}

/**
 * Walks the board towards a single solution by steepest descent on the solution count. Mutates
 * `pensByCell` and returns the count it ended on.
 */
function repairUniqueness({
  pensByCell,
  bullCells,
  gridSize,
  bullsPerGroup,
  stepBudget,
  random,
  now,
  deadline,
}: RepairArgs) {
  const bullCellSet = new Set(bullCells)
  const board = { gridSize, pensByCell }
  let currentCount = solveBoard(board, bullsPerGroup, { limit: OBJECTIVE_LIMIT }).count
  let plateauSteps = 0

  for (let step = 0; step < stepBudget && currentCount > 1; step += 1) {
    if (now() >= deadline) {
      return currentCount
    }

    // Two witnesses, so one of them is guaranteed not to be the intended solution.
    const witnesses = solveBoard(board, bullsPerGroup, { limit: 2, witnesses: 2 }).solutions
    const alternative = witnesses.find((solution) =>
      solution.some((cell) => !bullCellSet.has(cell)),
    )

    if (!alternative) {
      break
    }

    // Only cells the alternative actually relies on — plus their immediate surroundings, which
    // widens the move set enough to escape most dead ends.
    const candidateCells = new Set<number>()

    for (const cell of alternative) {
      if (bullCellSet.has(cell)) {
        continue
      }

      candidateCells.add(cell)

      for (const neighbor of getOrthogonalNeighbors(cell, gridSize)) {
        candidateCells.add(neighbor)
      }
    }

    const moves = shuffle(
      collectLegalMoves(
        pensByCell,
        bullCells,
        bullCellSet,
        gridSize,
        bullsPerGroup,
        Array.from(candidateCells),
      ),
      random,
    )

    if (moves.length === 0) {
      break
    }

    let bestMove: PenMove | null = null
    let bestCount = Number.POSITIVE_INFINITY

    for (const move of moves.slice(0, MOVES_PER_STEP)) {
      const from = pensByCell[move.cell]
      pensByCell[move.cell] = move.to
      const count = solveBoard(board, bullsPerGroup, { limit: OBJECTIVE_LIMIT }).count
      pensByCell[move.cell] = from

      // A move that removes the intended solution too is not a move we can take.
      if (count >= 1 && count < bestCount) {
        bestCount = count
        bestMove = move

        if (count === 1) {
          break
        }
      }
    }

    if (!bestMove) {
      break
    }

    plateauSteps = bestCount < currentCount ? 0 : plateauSteps + 1
    pensByCell[bestMove.cell] = bestMove.to
    currentCount = bestCount

    // No progress for a while: this layout is not going to get there, and a fresh attempt is
    // cheaper than climbing out.
    if (plateauSteps > 8) {
      break
    }
  }

  return currentCount
}
