import { z } from 'zod'

import { difficultySchema } from './level'
import { difficultyStatisticsSummarySchema } from './statistics'

export const levelProgressRecordSchema = z.object({
  difficulty: difficultySchema,
  levelNumber: z.number().int().positive(),
  bestTimeSeconds: z.number().int().nonnegative().nullable(),
  completedAt: z.string().nullable(),
  // Null when the player has never touched this level: there is no timestamp to report.
  updatedAt: z.string().nullable(),
})

export type LevelProgressRecord = z.infer<typeof levelProgressRecordSchema>

/**
 * A difficulty's progress as `levelNumber → bestTimeSeconds`, completed levels only.
 *
 * The list this replaced sent a full row per completed level — the difficulty repeated on every one,
 * plus `completedAt` and `updatedAt`, which no screen reads. The only thing rendered is the best
 * time on a level card, and an **absent key already means "not played"**, which is exactly what the
 * client assumed anyway.
 */
export type BestTimesByLevelRecord = Record<number, number>

/**
 * Everything the statistics page reads out of `level_progress`, fetched together.
 *
 * One shape rather than an overall summary plus four per-difficulty ones, because the repository
 * now answers all of it from a single `groupBy` — the total is a sum of the per-difficulty counts,
 * so splitting them apart only bought extra queries.
 */
export const progressStatisticsSummariesSchema = z.object({
  totalCompletedLevels: z.number().int().nonnegative(),
  byDifficulty: z.array(difficultyStatisticsSummarySchema),
})

export type ProgressStatisticsSummaries = z.infer<typeof progressStatisticsSummariesSchema>

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
