import type { Difficulty } from './level'

export type LevelProgress = {
  difficulty: Difficulty
  levelNumber: number
  bestTimeSeconds: number | null
  completedAt: string | null
  updatedAt: string
}
