import {
  getBullsPerGroupForDifficulty,
  getGridSizeForDifficulty,
  validateBoard,
} from '../../../shared/game'
import type { LevelDraft } from '../types'
import type { LevelValidationIssue } from './translateValidationIssue'

export { getBullsPerGroupForDifficulty, getGridSizeForDifficulty }

export type LevelValidationResult = {
  isValid: boolean
  /** Codes, not sentences — `translateValidationIssue` turns each one into the admin's language. */
  issues: LevelValidationIssue[]
  /** How many ways the puzzle can be solved. `null` when the rule checks failed first. */
  solutionCount: number | null
  /** True when counting stopped at the ceiling, so the real number is higher. */
  solutionCountReachedLimit: boolean
  bullsPerGroup: number
  distinctPenCount: number
}

/**
 * High enough to give the author a real number rather than "more than one", low enough that a
 * board with a huge solution set still answers instantly.
 */
const EDITOR_SOLUTION_LIMIT = 100

/**
 * Validates an editor draft. The rules themselves live in `shared/game/`, which the API imports
 * too, so the two sides can no longer drift apart.
 *
 * `pensByCell` here is `pensByCell` there; the draft's `cowsByCell` is the shared module's
 * `bullsByCell`.
 */
export function validateLevelDraft(draft: LevelDraft): LevelValidationResult {
  const issues: LevelValidationIssue[] = []

  if (!draft.title.trim()) {
    issues.push({ code: 'missing-title' })
  }

  const result = validateBoard(
    {
      difficulty: draft.difficulty,
      gridSize: draft.gridSize,
      pensByCell: draft.pensByCell,
      bullsByCell: draft.cowsByCell,
    },
    { countSolutions: true, solutionLimit: EDITOR_SOLUTION_LIMIT },
  )

  issues.push(...result.issues)

  return {
    isValid: issues.length === 0 && result.isValid,
    issues,
    solutionCount: result.solutionCount,
    solutionCountReachedLimit: result.solutionCountReachedLimit,
    bullsPerGroup: result.bullsPerGroup,
    distinctPenCount: result.distinctPenCount,
  }
}
