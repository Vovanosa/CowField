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

/**
 * One rule failure, as data rather than a sentence.
 *
 * These used to be English strings built right here, which was correct for this folder — it must
 * stay free of i18n exactly as it stays free of DOM and env — but it meant the strings travelled
 * verbatim into the admin's toast and into API 400 bodies, so a Ukrainian admin read English. A code
 * plus its numbers lets each edge decide the wording: `formatBoardValidationIssue` for the server
 * and the CLI scripts, i18next for the editor.
 *
 * `bullsPerGroup` rides along on the three issues whose wording needs a plural form, so a translator
 * gets a `count` to work with instead of a pre-baked "bull"/"bulls".
 */
export type BoardValidationIssue =
  | { code: 'grid-size'; difficulty: Difficulty; expectedGridSize: number }
  | { code: 'pen-grid-incomplete' }
  | { code: 'bull-layout-incomplete' }
  | { code: 'cell-without-pen' }
  | { code: 'pen-count'; gridSize: number }
  | { code: 'pen-too-small'; penId: number; bullsPerGroup: number }
  | { code: 'pen-not-connected'; penId: number }
  | { code: 'bull-count'; difficulty: Difficulty; expectedBullCount: number }
  | { code: 'row-bull-count'; bullsPerGroup: number }
  | { code: 'column-bull-count'; bullsPerGroup: number }
  | { code: 'pen-bull-count'; penId: number; bullsPerGroup: number }
  | { code: 'bulls-touching' }
  | { code: 'no-solution' }

/** Every `code` a `BoardValidationIssue` can carry — so a translator can be checked for coverage. */
export const BOARD_VALIDATION_ISSUE_CODES = [
  'grid-size',
  'pen-grid-incomplete',
  'bull-layout-incomplete',
  'cell-without-pen',
  'pen-count',
  'pen-too-small',
  'pen-not-connected',
  'bull-count',
  'row-bull-count',
  'column-bull-count',
  'pen-bull-count',
  'bulls-touching',
  'no-solution',
] as const satisfies readonly BoardValidationIssue['code'][]

/**
 * The English wording, for the places that have no translator: API 400 bodies and the
 * `levels:generate` / `levels:audit` CLI output.
 *
 * Kept byte-identical to the strings this module used to push, so server responses and script logs
 * did not change when the issues became structured.
 */
export function formatBoardValidationIssue(issue: BoardValidationIssue): string {
  switch (issue.code) {
    case 'grid-size':
      return `Grid size must stay ${issue.expectedGridSize} x ${issue.expectedGridSize} for ${issue.difficulty}.`
    case 'pen-grid-incomplete':
      return 'The pen grid is incomplete.'
    case 'bull-layout-incomplete':
      return 'The authored bull layout is incomplete.'
    case 'cell-without-pen':
      return 'Every cell must belong to a pen.'
    case 'pen-count':
      return `A ${issue.gridSize} x ${issue.gridSize} level must use exactly ${issue.gridSize} pens.`
    case 'pen-too-small':
      return `Pen ${issue.penId} is too small for ${issue.bullsPerGroup} bull placements.`
    case 'pen-not-connected':
      return `Pen ${issue.penId} must be one connected region.`
    case 'bull-count':
      return `The authored bull layout must place exactly ${issue.expectedBullCount} bulls for ${issue.difficulty}.`
    case 'row-bull-count':
      return `Each row must contain exactly ${issue.bullsPerGroup} ${pluralizeBull(issue.bullsPerGroup)}.`
    case 'column-bull-count':
      return `Each column must contain exactly ${issue.bullsPerGroup} ${pluralizeBull(issue.bullsPerGroup)}.`
    case 'pen-bull-count':
      return `Pen ${issue.penId} must contain exactly ${issue.bullsPerGroup} ${pluralizeBull(issue.bullsPerGroup)}.`
    case 'bulls-touching':
      return 'Bulls may not touch, including diagonally.'
    case 'no-solution':
      return 'This level has no valid solution.'
  }
}

/** English only, and only for `formatBoardValidationIssue`. Real plurals are the translator's job. */
function pluralizeBull(count: number) {
  return count === 1 ? 'bull' : 'bulls'
}

export type BoardValidationResult = {
  isValid: boolean
  issues: BoardValidationIssue[]
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
  const issues: BoardValidationIssue[] = []

  const fail = (distinctPenCount: number): BoardValidationResult => ({
    isValid: false,
    issues,
    bullsPerGroup,
    distinctPenCount,
    solutionCount: null,
    solutionCountReachedLimit: false,
  })

  if (board.gridSize !== expectedGridSize) {
    issues.push({ code: 'grid-size', difficulty: board.difficulty, expectedGridSize })
  }

  if (board.pensByCell.length !== totalCells) {
    issues.push({ code: 'pen-grid-incomplete' })
  }

  if (board.bullsByCell.length !== totalCells) {
    issues.push({ code: 'bull-layout-incomplete' })
  }

  // Everything below indexes by cell, so stop while the arrays are the wrong shape.
  if (issues.length > 0) {
    return fail(0)
  }

  const penIds = getPenIds(board.pensByCell)

  if (board.pensByCell.some((penId) => penId === 0)) {
    issues.push({ code: 'cell-without-pen' })
  }

  if (penIds.length !== board.gridSize) {
    issues.push({ code: 'pen-count', gridSize: board.gridSize })
  }

  for (const penId of penIds) {
    const cells = getPenCells(board.pensByCell, penId)

    if (cells.length < bullsPerGroup) {
      issues.push({ code: 'pen-too-small', penId, bullsPerGroup })
    }

    if (!isConnectedRegion(cells, board.gridSize)) {
      issues.push({ code: 'pen-not-connected', penId })
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
    issues.push({ code: 'no-solution' })
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
  const issues: BoardValidationIssue[] = []
  const bullIndexes = getBullIndexes(board.bullsByCell)
  const expectedBullCount = board.gridSize * bullsPerGroup

  if (bullIndexes.length !== expectedBullCount) {
    issues.push({ code: 'bull-count', difficulty: board.difficulty, expectedBullCount })
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

  if (rowCounts.some((count) => count !== bullsPerGroup)) {
    issues.push({ code: 'row-bull-count', bullsPerGroup })
  }

  if (columnCounts.some((count) => count !== bullsPerGroup)) {
    issues.push({ code: 'column-bull-count', bullsPerGroup })
  }

  for (const penId of penIds) {
    if ((penCounts.get(penId) ?? 0) !== bullsPerGroup) {
      issues.push({ code: 'pen-bull-count', penId, bullsPerGroup })
    }
  }

  for (let left = 0; left < bullIndexes.length; left += 1) {
    for (let right = left + 1; right < bullIndexes.length; right += 1) {
      if (areCellsTouching(bullIndexes[left], bullIndexes[right], board.gridSize)) {
        issues.push({ code: 'bulls-touching' })
        return issues
      }
    }
  }

  return issues
}
