import {
  areCellsTouching,
  getBullIndexes,
  getBullsPerGroupForDifficulty,
  getCellColumn,
  getCellRow,
  getGridSizeForDifficulty,
  getPenCells,
  getPenIds,
  isConnectedRegion,
  type BullBoard,
  type Difficulty,
} from './board'
import { solveBoard } from './solver'

export type ValidatableBoard = BullBoard & {
  difficulty: Difficulty
}

export type BoardValidationOptions = {
  /**
   * Also count how many ways the board can be solved. Off by default: it is the expensive part, and
   * the API does not need it (a legal bull layout is itself a solution, so a board that passes the
   * rule checks always has at least one).
   */
  countSolutions?: boolean
  /** Stop counting here. `2` answers "unique?"; a higher value gives the author a real number. */
  solutionLimit?: number
}

export type BoardValidationResult = {
  isValid: boolean
  issues: string[]
  bullsPerGroup: number
  distinctPenCount: number
  /** `null` when counting was not requested, or when the rule checks already failed. */
  solutionCount: number | null
  /** True when counting stopped at the limit, so the real number is higher. */
  solutionCountReachedLimit: boolean
}

/**
 * Validates a level draft against the puzzle rules, from board state alone. There is deliberately
 * no stored solution to check against — `bullsByCell` is authoring metadata, and correctness is
 * always derived.
 *
 * More than one solution is **not** an error here. It is a quality signal the editor surfaces, so
 * an author can still save a multi-solution level knowingly.
 */
export function validateBoard(
  board: ValidatableBoard,
  options: BoardValidationOptions = {},
): BoardValidationResult {
  const bullsPerGroup = getBullsPerGroupForDifficulty(board.difficulty)
  const expectedGridSize = getGridSizeForDifficulty(board.difficulty)
  const totalCells = board.gridSize * board.gridSize
  const issues: string[] = []

  const fail = (distinctPenCount: number): BoardValidationResult => ({
    isValid: false,
    issues,
    bullsPerGroup,
    distinctPenCount,
    solutionCount: null,
    solutionCountReachedLimit: false,
  })

  if (board.gridSize !== expectedGridSize) {
    issues.push(
      `Grid size must stay ${expectedGridSize} x ${expectedGridSize} for ${board.difficulty}.`,
    )
  }

  if (board.pensByCell.length !== totalCells) {
    issues.push('The pen grid is incomplete.')
  }

  if (board.bullsByCell.length !== totalCells) {
    issues.push('The authored bull layout is incomplete.')
  }

  // Everything below indexes by cell, so stop while the arrays are the wrong shape.
  if (issues.length > 0) {
    return fail(0)
  }

  const penIds = getPenIds(board.pensByCell)

  if (board.pensByCell.some((penId) => penId === 0)) {
    issues.push('Every cell must belong to a pen.')
  }

  if (penIds.length !== board.gridSize) {
    issues.push(
      `A ${board.gridSize} x ${board.gridSize} level must use exactly ${board.gridSize} pens.`,
    )
  }

  for (const penId of penIds) {
    const cells = getPenCells(board.pensByCell, penId)

    if (cells.length < bullsPerGroup) {
      issues.push(`Pen ${penId} is too small for ${bullsPerGroup} bull placements.`)
    }

    if (!isConnectedRegion(cells, board.gridSize)) {
      issues.push(`Pen ${penId} must be one connected region.`)
    }
  }

  issues.push(...getBullLayoutIssues(board, bullsPerGroup, penIds))

  if (issues.length > 0) {
    return fail(penIds.length)
  }

  if (!options.countSolutions) {
    return {
      isValid: true,
      issues,
      bullsPerGroup,
      distinctPenCount: penIds.length,
      solutionCount: null,
      solutionCountReachedLimit: false,
    }
  }

  const solved = solveBoard(board, bullsPerGroup, { limit: Math.max(2, options.solutionLimit ?? 2) })

  // Unreachable while the layout checks above pass — a legal layout is a solution. Kept as a net,
  // because "this level cannot be finished" is the one thing that must never ship.
  if (solved.count === 0) {
    issues.push('This level has no valid solution.')
  }

  return {
    isValid: issues.length === 0,
    issues,
    bullsPerGroup,
    distinctPenCount: penIds.length,
    solutionCount: solved.count,
    solutionCountReachedLimit: solved.reachedLimit,
  }
}

function getBullLayoutIssues(board: ValidatableBoard, bullsPerGroup: number, penIds: number[]) {
  const issues: string[] = []
  const bullIndexes = getBullIndexes(board.bullsByCell)
  const expectedBullCount = board.gridSize * bullsPerGroup

  if (bullIndexes.length !== expectedBullCount) {
    issues.push(
      `The authored bull layout must place exactly ${expectedBullCount} bulls for ${board.difficulty}.`,
    )
    return issues
  }

  const rowCounts = new Array<number>(board.gridSize).fill(0)
  const columnCounts = new Array<number>(board.gridSize).fill(0)
  const penCounts = new Map<number, number>()

  for (const bullIndex of bullIndexes) {
    rowCounts[getCellRow(bullIndex, board.gridSize)] += 1
    columnCounts[getCellColumn(bullIndex, board.gridSize)] += 1
    const penId = board.pensByCell[bullIndex]
    penCounts.set(penId, (penCounts.get(penId) ?? 0) + 1)
  }

  const bullWord = bullsPerGroup === 1 ? 'bull' : 'bulls'

  if (rowCounts.some((count) => count !== bullsPerGroup)) {
    issues.push(`Each row must contain exactly ${bullsPerGroup} ${bullWord}.`)
  }

  if (columnCounts.some((count) => count !== bullsPerGroup)) {
    issues.push(`Each column must contain exactly ${bullsPerGroup} ${bullWord}.`)
  }

  for (const penId of penIds) {
    if ((penCounts.get(penId) ?? 0) !== bullsPerGroup) {
      issues.push(`Pen ${penId} must contain exactly ${bullsPerGroup} ${bullWord}.`)
    }
  }

  for (let left = 0; left < bullIndexes.length; left += 1) {
    for (let right = left + 1; right < bullIndexes.length; right += 1) {
      if (areCellsTouching(bullIndexes[left], bullIndexes[right], board.gridSize)) {
        issues.push('Bulls may not touch, including diagonally.')
        return issues
      }
    }
  }

  return issues
}
