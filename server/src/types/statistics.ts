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

/**
 * One row of `player_statistics_totals` — the two lifetime counters we actually accumulate.
 *
 * Both only ever grow. Everything else on the statistics page is derived from `level_progress` at
 * read time, which is why this is deliberately small.
 */
export const playerStatisticsRecordSchema = z.object({
  totalBullPlacements: z.number().int().nonnegative(),
  /** Time actually played, in seconds — every completion, replays included. */
  totalCompletionTimeSeconds: z.number().int().nonnegative(),
  // Null until the player has a totals row at all.
  updatedAt: z.string().nullable(),
})

/** What `GET /api/statistics` returns: the stored counters plus everything derived per read. */
export const playerStatisticsSummarySchema = z.object({
  totalCompletedLevels: z.number().int().nonnegative(),
  totalBullPlacements: z.number().int().nonnegative(),
  totalCompletionTimeSeconds: z.number().int().nonnegative(),
  byDifficulty: z.array(difficultyStatisticsSummarySchema),
})

export type PlayerStatisticsRecord = z.infer<typeof playerStatisticsRecordSchema>

export type DifficultyStatisticsSummary = z.infer<typeof difficultyStatisticsSummarySchema>
export type PlayerStatisticsSummary = z.infer<typeof playerStatisticsSummarySchema>
