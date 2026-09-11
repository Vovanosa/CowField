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
  /**
   * Accept a board with up to this many solutions. **Defaults to 1 — a genuinely unique puzzle.**
   *
   * Raising it is a deliberate quality trade, and only `extreme` makes it. At 15x15 with three bulls
   * the repair loop cannot drive a board all the way to one solution in any practical budget, and a
   * board with a handful of solutions is still perfectly playable: the game validates a win from the
   * board and the rules, never from a stored solution (universal rule 4), so *any* legal arrangement
   * the player finds is accepted. What is lost is the guarantee that pure deduction is enough —
   * a level with several solutions can reach a point where the player must pick.
   *
   * Never raise it for the four original difficulties: they reach 1 easily and always have.
   */
  maxSolutions?: number
}

export type GeneratedBoard = {
  gridSize: number
  pensByCell: number[]
  bullsByCell: boolean[]
  /** Solutions the board actually has, bounded by the counter. 1 unless `maxSolutions` was raised. */
  solutionCount: number
  attempts: number
  elapsedMs: number
}

/**
 * Counting ceiling used as the search objective. It has to be far above the starting count or the
 * objective saturates and the descent is blind: freshly grown 10x10 boards start in the thousands.
 */
const OBJECTIVE_LIMIT = 40000

/**
 * The same ceiling, for boards where 40000 is unreachable in any sane time.
 *
 * `extreme` is 15x15 with three bulls, and a freshly grown board there has *far* more than 40000
 * solutions — so every scoring solve ran the counter to the full 40000 cap. That is the worst of
 * both worlds: maximally expensive, and completely uninformative, because all twenty candidates tie
 * at the cap. Measured before this existed, a single `generateUniqueBoard('extreme')` call never
 * returned a board and overran an 8s budget to 23s.
 *
 * A low ceiling makes each solve cheap and bounded. It saturates immediately on a big board, which
 * is what the saturated branch in `repairUniqueness` is for.
 */
const LARGE_BOARD_OBJECTIVE_LIMIT = 400

/**
 * Total bulls on the board — `gridSize * bullsPerGroup` — above which the low ceiling applies.
 *
 * `hard` is the largest shipped board under the original tuning at 10x10x2 = 20 bulls, so every
 * existing difficulty keeps the behaviour it was tuned with and only `extreme` takes the new path.
 */
const LARGE_BOARD_BULL_COUNT = 20

function getObjectiveLimit(gridSize: number, bullsPerGroup: number) {
  return gridSize * bullsPerGroup > LARGE_BOARD_BULL_COUNT
    ? LARGE_BOARD_OBJECTIVE_LIMIT
    : OBJECTIVE_LIMIT
}

/**
 * Work ceiling for one solve while repairing a large board.
 *
 * Without this the repair loop cannot be budgeted at all, because solve cost tracks **pen shape**
 * rather than board size: measured on 15x15 with three bulls, merely finding the first two solutions
 * cost 4 seconds with row-shaped pens and 1 millisecond with compact ones, and the snake pens this
 * generator grows on purpose sit at the expensive end. A step that takes seconds makes a 150-step
 * repair impossible; a step bounded by nodes makes it arithmetic.
 *
 * The cost is honesty about the answer — see `truncated` on `SolveResult`. During repair that is
 * fine: an underestimate of the solution count only misdirects the descent, it cannot produce a
 * wrong board, because the board is verified separately before it is used.
 */
const LARGE_BOARD_SOLVE_NODES = 4000

function getSolveNodeBudget(gridSize: number, bullsPerGroup: number) {
  return gridSize * bullsPerGroup > LARGE_BOARD_BULL_COUNT ? LARGE_BOARD_SOLVE_NODES : undefined
}

/**
 * The budget for the one verification that decides whether a board is kept — far larger than the
 * per-step repair budget, because it runs once per accepted board rather than hundreds of times per
 * attempt, and its answer is the one that ships.
 *
 * Still bounded on large boards: proving a 15x15 board has no second solution can cost seconds, and
 * a generator that stalls is worse than one that rejects a good board now and then. Unbounded for
 * the four original difficulties, where the proof is cheap and the guarantee is absolute.
 */
const LARGE_BOARD_VERIFY_NODES = 20000

function getVerifyNodeBudget(gridSize: number, bullsPerGroup: number) {
  return gridSize * bullsPerGroup > LARGE_BOARD_BULL_COUNT ? LARGE_BOARD_VERIFY_NODES : undefined
}

/**
 * The same budget, addressed by difficulty, for callers that re-check a board independently —
 * `levels:generate` does, so a generator bug cannot put an unverified board in the library.
 *
 * Exported so the two checks agree by construction. They were briefly allowed to differ, and the
 * re-check's larger budget silently became the slowest step in the whole batch: a node is not a
 * cheap unit, since each one walks up to 286 row patterns on a 15x15 board.
 */
export function getVerificationNodeBudget(difficulty: Difficulty) {
  return getVerifyNodeBudget(
    getGridSizeForDifficulty(difficulty),
    getBullsPerGroupForDifficulty(difficulty),
  )
}

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
  const maxSolutions = Math.max(1, options.maxSolutions ?? 1)

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (now() >= deadline) {
      return null
    }

    const bullCells = pickBullLayout(gridSize, bullsPerGroup, random)

    if (!bullCells) {
      continue
    }

    // Checked again here, and after the pens: laying out 45 non-touching bulls on a 15x15 grid is
    // itself a backtracking search and has been measured taking ten seconds, so a budget only
    // enforced once per attempt is not a budget.
    if (now() >= deadline) {
      return null
    }

    const pensByCell = growSnakePens(bullCells, gridSize, bullsPerGroup, random)

    if (!pensByCell) {
      continue
    }

    // The repair loop drives the count down; the verification below is what decides.
    repairUniqueness({
      pensByCell,
      bullCells,
      gridSize,
      bullsPerGroup,
      stepBudget,
      random,
      now,
      deadline,
    })

    /*
      Accept on a fresh verification, not on the repair loop's running count.

      The repair's count comes from node-budgeted solves on large boards, so it can be **0** simply
      because the search was cut off before it found anything — and 0 was being read as "the repair
      destroyed the intended solution" and thrown away, which is why `extreme` rejected every board
      it built. The board always has at least the intended solution by construction.

      So the count that decides is taken here, with a budget generous enough to be worth trusting,
      and `limit` one past the threshold so the search stops as soon as the board is disqualified
      rather than counting out an answer nobody needs.
    */
    const verification = solveBoard(
      { gridSize, pensByCell },
      bullsPerGroup,
      { limit: maxSolutions + 1, maxNodes: getVerifyNodeBudget(gridSize, bullsPerGroup) },
    )

    if (verification.count < 1 || verification.count > maxSolutions) {
      continue
    }

    const solutionCount = verification.count

    const bullsByCell = new Array<boolean>(gridSize * gridSize).fill(false)
    for (const cell of bullCells) {
      bullsByCell[cell] = true
    }

    return {
      gridSize,
      pensByCell,
      bullsByCell,
      solutionCount,
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
/**
 * Nodes one layout attempt may explore before giving up and letting the caller start over.
 *
 * Placing 45 mutually non-touching bulls at three per row *and* three per column is a constraint
 * search in its own right, and it has a heavy tail: measured on 15x15, one call took **22 seconds**
 * while others finished in a millisecond, on the same input. A long run is not progress — it is the
 * search grinding through one bad opening — and the caller already loops, with fresh randomness each
 * time. Capping the attempt turns a 22-second stall into a few dozen cheap tries.
 */
const LAYOUT_NODE_BUDGET = 12000

function pickBullLayout(gridSize: number, bullsPerGroup: number, random: () => number) {
  const patterns = getRowPatterns(gridSize, bullsPerGroup)
  const patternCount = patterns.length
  const columnCounts = new Array<number>(gridSize).fill(0)
  const chosen: number[][] = []
  let nodes = 0

  function search(row: number, previousPattern: number[]): boolean {
    nodes += 1

    if (nodes > LAYOUT_NODE_BUDGET) {
      return false
    }

    if (row === gridSize) {
      return columnCounts.every((count) => count === bullsPerGroup)
    }

    /*
      A random *starting point*, walked cyclically — not a shuffled copy.

      This used to call `shuffle(patterns, random)` at every node, copying all 286 patterns of a
      15x15 board on each step of a backtracking search. Hoisting the shuffle out of the loop was
      worse, not better: a single fixed order removes the randomisation that keeps the search from
      sinking into one hopeless subtree and exploring it exhaustively. A per-node rotation keeps that
      randomisation and costs one modulo.
    */
    const offset = Math.floor(random() * patternCount)

    for (let step = 0; step < patternCount; step += 1) {
      const pattern = patterns[(offset + step) % patternCount]

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

      /*
        A column that cannot still reach its quota in the rows that remain is a dead end, and without
        this the search only finds that out at the very bottom — then backtracks and rediscovers it
        down every other branch.

        `solveBoard` has had exactly this prune all along; this function never did, which did not
        matter while the shapes were small. On 15x15 with three bulls per column it is the difference
        between finding a layout and thrashing: measured before, a single call ranged from 1ms to
        over ten seconds on identical input.
      */
      const rowsLeft = gridSize - row - 1
      let reachable = true

      for (let column = 0; column < gridSize; column += 1) {
        if (columnCounts[column] + rowsLeft < bullsPerGroup) {
          reachable = false
          break
        }
      }

      if (reachable && search(row + 1, pattern)) {
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
  } else if (
    !seedMultiBullPens(bullCells, pensByCell, penSizes, gridSize, bullsPerGroup, random)
  ) {
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
/**
 * Puts the bulls into pens of `bullsPerGroup`, each pen connected by a carved corridor.
 *
 * **This used to assume pairs**, which is all `hard` ever needed: it took a seed, found one nearest
 * mate, set the pen size to 2 and finally demanded an empty pool. For `extreme` — 45 bulls in 15
 * pens of three — that left 15 bulls over on every single attempt, so it returned `false` every
 * time and the difficulty could never produce a board at all. The quota is a parameter now.
 */
function seedMultiBullPens(
  bullCells: number[],
  pensByCell: number[],
  penSizes: number[],
  gridSize: number,
  bullsPerGroup: number,
  random: () => number,
) {
  const pool = shuffle(bullCells, random)
  /*
    Every bull on the board, so a corridor can refuse to swallow one.

    A corridor claims any cell it crosses that has no pen yet — and a bull still waiting in the pool
    has no pen yet. Absorbing one silently gave that pen an extra bull and left its rightful pen a
    bull short, so no arrangement could satisfy every pen's quota and the finished board had **zero**
    solutions. Long corridors make it likely, which is why it surfaced at three bulls per pen.
  */
  const bullCellSet = new Set(bullCells)
  let penId = 1

  while (pool.length >= bullsPerGroup && penId <= gridSize) {
    const members: number[] = [pool.shift() as number]
    pensByCell[members[0]] = penId
    penSizes[penId] = 1

    // Take the pen up to its quota one bull at a time, always the bull closest to something the pen
    // already owns. Growing outward from the pen rather than from its first cell keeps the corridors
    // short, which matters because every corridor cell is a cell the snake-growing pass below no
    // longer gets to shape.
    while (members.length < bullsPerGroup) {
      let nearestIndex = 0
      let nearestMember = members[0]
      let nearestDistance = Number.POSITIVE_INFINITY

      for (let index = 0; index < pool.length; index += 1) {
        for (const member of members) {
          const distance =
            Math.abs(getCellRow(pool[index], gridSize) - getCellRow(member, gridSize)) +
            Math.abs(getCellColumn(pool[index], gridSize) - getCellColumn(member, gridSize))

          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestIndex = index
            nearestMember = member
          }
        }
      }

      const mate = pool.splice(nearestIndex, 1)[0]
      pensByCell[mate] = penId
      penSizes[penId] += 1

      if (
        !carveCorridor(pensByCell, penSizes, nearestMember, mate, penId, gridSize, bullCellSet)
      ) {
        return false
      }

      members.push(mate)
    }

    penId += 1
  }

  return pool.length === 0
}

/**
 * Claims the cells of an L-shaped path from `from` to `to` for `penId`, so the two end up in one
 * connected pen.
 *
 * Returns false when the path runs into a different pen: that pairing cannot be connected this way,
 * and the caller starts over with a fresh bull layout rather than leaving a disconnected pen behind.
 */
function carveCorridor(
  pensByCell: number[],
  penSizes: number[],
  from: number,
  to: number,
  penId: number,
  gridSize: number,
  bullCells: Set<number>,
) {
  let row = getCellRow(from, gridSize)
  let column = getCellColumn(from, gridSize)
  const targetRow = getCellRow(to, gridSize)
  const targetColumn = getCellColumn(to, gridSize)
  let guard = 0

  while ((row !== targetRow || column !== targetColumn) && guard < 4 * gridSize) {
    guard += 1

    if (row !== targetRow) {
      row += row < targetRow ? 1 : -1
    } else {
      column += column < targetColumn ? 1 : -1
    }

    const cellIndex = row * gridSize + column

    if (cellIndex === to) {
      break
    }

    if (pensByCell[cellIndex] === 0) {
      // An unassigned bull is not free space — see `bullCellSet` above.
      if (bullCells.has(cellIndex)) {
        return false
      }

      pensByCell[cellIndex] = penId
      penSizes[penId] += 1
    } else if (pensByCell[cellIndex] !== penId) {
      return false
    }
  }

  return true
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
  const objectiveLimit = getObjectiveLimit(gridSize, bullsPerGroup)
  const maxNodes = getSolveNodeBudget(gridSize, bullsPerGroup)
  let currentCount = solveBoard(board, bullsPerGroup, { limit: objectiveLimit, maxNodes }).count
  let plateauSteps = 0

  for (let step = 0; step < stepBudget && currentCount > 1; step += 1) {
    if (now() >= deadline) {
      return currentCount
    }

    // Two witnesses, so one of them is guaranteed not to be the intended solution.
    const witnesses = solveBoard(board, bullsPerGroup, { limit: 2, witnesses: 2, maxNodes }).solutions
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

    /*
      Saturated objective: scoring would be twenty solves that all come back with the same number.

      Descend by construction instead of by measurement. Moving a cell the alternative places a bull
      on **always** kills that alternative — its pen loses a bull and the receiving pen gains one, so
      the alternative no longer holds its quota in either — while `collectLegalMoves` has already
      guaranteed the intended solution survives the move. One bounded solve per step instead of
      twenty unbounded ones, and guaranteed progress rather than a blind tie-break.

      This is the path `extreme` spends most of its repair on; every smaller difficulty starts below
      the ceiling and never enters it, so their tuning is untouched.
    */
    if (currentCount >= objectiveLimit) {
      const alternativeCells = new Set(
        alternative.filter((cell) => !bullCellSet.has(cell)),
      )
      const killingMove = moves.find((move) => alternativeCells.has(move.cell))

      if (!killingMove) {
        break
      }

      pensByCell[killingMove.cell] = killingMove.to
      currentCount = solveBoard(board, bullsPerGroup, { limit: objectiveLimit, maxNodes }).count
      continue
    }

    let bestMove: PenMove | null = null
    let bestCount = Number.POSITIVE_INFINITY

    for (const move of moves.slice(0, MOVES_PER_STEP)) {
      if (now() >= deadline) {
        return currentCount
      }

      const from = pensByCell[move.cell]
      pensByCell[move.cell] = move.to
      const count = solveBoard(board, bullsPerGroup, { limit: objectiveLimit, maxNodes }).count
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
