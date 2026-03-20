import type { TFunction } from 'i18next'

import type { Difficulty } from './types'

const difficultyLabels: Record<Difficulty, string> = {
  light: 'Light',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function getDifficultyLabel(t: TFunction, difficulty: Difficulty) {
  return t(difficultyLabels[difficulty])
}
