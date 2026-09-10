import type { Difficulty } from './types'

/** Just enough of i18next's `t` to format a string. */
export type TranslateFn = (key: string, options?: Record<string, unknown>) => string

const difficultyLabels: Record<Difficulty, string> = {
  light: 'Light',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

/**
 * Takes the same narrowed `t` the page components pass around rather than i18next's `TFunction`,
 * so a caller that already narrowed it (`useLevelEditor`, and the validation translator) can use
 * this instead of keeping a second copy of the label map.
 */
export function getDifficultyLabel(t: TranslateFn, difficulty: Difficulty) {
  return t(difficultyLabels[difficulty])
}
