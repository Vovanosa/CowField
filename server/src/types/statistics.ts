import { z } from 'zod'

import { difficultySchema } from './level'

export const playerStatisticsRecordSchema = z.object({
  totalBullPlacements: z.number().int().nonnegative(),
  updatedAt: z.string(),
})

export type PlayerStatisticsRecord = z.infer<typeof playerStatisticsRecordSchema>

export type DifficultyStatisticsSummary = {
  difficulty: z.infer<typeof difficultySchema>
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
