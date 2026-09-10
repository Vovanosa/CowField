import type { BoardValidationIssue } from '../../../shared/game'
import { getDifficultyLabel, type TranslateFn } from '../getDifficultyLabel'

/**
 * An editor-only issue, on top of the board rules.
 *
 * The title is not a puzzle rule — `shared/game/` knows nothing about it, and should not — so it
 * gets its own code here and travels in the same list.
 */
export type EditorValidationIssue = { code: 'missing-title' }

export type LevelValidationIssue = BoardValidationIssue | EditorValidationIssue

/**
 * Turn a validation issue into a sentence in the player's language.
 *
 * Before this, `shared/game/validation.ts` built English prose and the editor put it straight into a
 * toast, so a Ukrainian admin got English. The rules folder still holds no i18n — it hands out a
 * `code` and its numbers, and the wording is chosen here.
 *
 * The three `bullsPerGroup` issues pass **`count`**, which is what lets i18next pick the right
 * plural form per language — Ukrainian has three where English has two, and hard levels use 2 bulls
 * per group where every other difficulty uses 1.
 */
export function translateValidationIssue(t: TranslateFn, issue: LevelValidationIssue): string {
  switch (issue.code) {
    case 'missing-title':
      return t('Add a level title.')
    case 'grid-size':
      return t('Grid size must stay {{size}} x {{size}} for {{difficulty}}.', {
        size: issue.expectedGridSize,
        difficulty: getDifficultyLabel(t, issue.difficulty),
      })
    case 'pen-grid-incomplete':
      return t('The pen grid is incomplete.')
    case 'bull-layout-incomplete':
      return t('The authored bull layout is incomplete.')
    case 'cell-without-pen':
      return t('Every cell must belong to a pen.')
    case 'pen-count':
      return t('A {{size}} x {{size}} level must use exactly {{size}} pens.', {
        size: issue.gridSize,
      })
    case 'pen-too-small':
      return t('Pen {{penId}} is too small for {{count}} bull placements.', {
        penId: issue.penId,
        count: issue.bullsPerGroup,
      })
    case 'pen-not-connected':
      return t('Pen {{penId}} must be one connected region.', { penId: issue.penId })
    case 'bull-count':
      return t('The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.', {
        count: issue.expectedBullCount,
        difficulty: getDifficultyLabel(t, issue.difficulty),
      })
    case 'row-bull-count':
      return t('Each row must contain exactly {{count}} bulls.', { count: issue.bullsPerGroup })
    case 'column-bull-count':
      return t('Each column must contain exactly {{count}} bulls.', { count: issue.bullsPerGroup })
    case 'pen-bull-count':
      return t('Pen {{penId}} must contain exactly {{count}} bulls.', {
        penId: issue.penId,
        count: issue.bullsPerGroup,
      })
    case 'bulls-touching':
      return t('Bulls may not touch, including diagonally.')
    case 'no-solution':
      return t('This level has no valid solution.')
  }
}
