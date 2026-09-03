import type { Difficulty } from './level'

export type LevelProgress = {
  difficulty: Difficulty
  levelNumber: number
  bestTimeSeconds: number | null
  completedAt: string | null
  /** Null when nothing has ever been recorded for this level. */
  updatedAt: string | null
}
