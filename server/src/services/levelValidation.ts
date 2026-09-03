import { validateBoard } from '../../../shared/game'
import type { LevelRecordInput } from '../schemas/levelSchemas'

type ValidationResult = {
  isValid: boolean
  issues: string[]
}

/**
 * Validates a level submitted to the API.
 *
 * The rules come from `shared/game/`, which the web app imports too — this used to be a second,
 * hand-maintained copy of the same rules that had already drifted (different messages, and no
 * solution checking at all, which made the API the weaker gate).
 *
 * Solution counting is deliberately off here. A legal bull layout *is* a solution, so anything that
 * passes these checks is solvable, and how many ways it can be solved is an authoring-quality
 * question the editor answers for the admin rather than something the API refuses.
 *
 * The record's `colorsByCell` is the shared module's `pensByCell`, and `cowsByCell` is its
 * `bullsByCell`.
 */
export function validateLevelRecord(input: LevelRecordInput): ValidationResult {
  const result = validateBoard({
    difficulty: input.difficulty,
    gridSize: input.gridSize,
    pensByCell: input.colorsByCell,
    bullsByCell: input.cowsByCell,
  })

  return {
    isValid: result.isValid,
    issues: result.issues,
  }
}
