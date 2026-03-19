import type { Difficulty } from './level'

export type DifficultyStatisticsSummary = {
  difficulty: Difficulty
  completedLevels: number
  fastestLevel: {
    levelNumber: number
    timeSeconds: number
  } | null
  averageTimeSeconds: number | null
}

export type PlayerStatisticsSummary = {
  totalCompletedLevels: number
  totalBullPlacements: number
  totalCompletionTimeSeconds: number
  byDifficulty: DifficultyStatisticsSummary[]
}
