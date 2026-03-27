import { z } from 'zod'

import { difficultySchema } from './level'

export const difficultyStatisticsSummarySchema = z.object({
  difficulty: difficultySchema,
  completedLevels: z.number().int().nonnegative(),
  fastestLevel: z
    .object({
      levelNumber: z.number().int().positive(),
      timeSeconds: z.number().int().nonnegative(),
    })
    .nullable(),
  averageTimeSeconds: z.number().int().nonnegative().nullable(),
})

export const playerStatisticsRecordSchema = z.object({
  totalCompletedLevels: z.number().int().nonnegative(),
  totalBullPlacements: z.number().int().nonnegative(),
  totalCompletionTimeSeconds: z.number().int().nonnegative(),
  byDifficulty: z.array(difficultyStatisticsSummarySchema),
  updatedAt: z.string(),
})

export type PlayerStatisticsRecord = z.infer<typeof playerStatisticsRecordSchema>

export type DifficultyStatisticsSummary = z.infer<typeof difficultyStatisticsSummarySchema>
export type PlayerStatisticsSummary = Omit<PlayerStatisticsRecord, 'updatedAt'>
