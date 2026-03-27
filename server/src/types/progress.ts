import { z } from 'zod'

import { difficultySchema } from './level'

export const levelProgressRecordSchema = z.object({
  difficulty: difficultySchema,
  levelNumber: z.number().int().positive(),
  bestTimeSeconds: z.number().int().nonnegative().nullable(),
  completedAt: z.string().nullable(),
  updatedAt: z.string(),
})

export type LevelProgressRecord = z.infer<typeof levelProgressRecordSchema>

export const overallProgressStatisticsSummarySchema = z.object({
  totalCompletedLevels: z.number().int().nonnegative(),
  totalCompletionTimeSeconds: z.number().int().nonnegative(),
})

export type OverallProgressStatisticsSummary = z.infer<
  typeof overallProgressStatisticsSummarySchema
>

export const difficultyOverviewRecordSchema = z.object({
  difficulty: difficultySchema,
  completedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
})

export type DifficultyOverviewRecord = z.infer<typeof difficultyOverviewRecordSchema>

export const progressOverviewRecordSchema = z.object({
  difficulties: z.array(difficultyOverviewRecordSchema),
})

export type ProgressOverviewRecord = z.infer<typeof progressOverviewRecordSchema>

export const difficultyProgressSummaryRecordSchema = z.object({
  difficulty: difficultySchema,
  completedCount: z.number().int().nonnegative(),
})

export type DifficultyProgressSummaryRecord = z.infer<
  typeof difficultyProgressSummaryRecordSchema
>
