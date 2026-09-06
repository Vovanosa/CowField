import { z } from 'zod'

import {
  INT4_MAX,
  MAX_BULL_PLACEMENTS_PER_REQUEST,
  MAX_LEVEL_TIME_SECONDS,
  MIN_LEVEL_TIME_SECONDS,
} from '../../../shared/apiLimits'
import { difficultySchema } from '../types/level'

export const progressParamsSchema = z.object({
  difficulty: difficultySchema,
  // Bounded to `int4`: `level_number` is an `Int` column, so an out-of-range number used to reach
  // Prisma and come back as a 500 instead of the 404 it actually is.
  levelNumber: z.coerce.number().int().positive().max(INT4_MAX),
})

export const progressDifficultyParamsSchema = z.object({
  difficulty: difficultySchema,
})

export const completeLevelInputSchema = z.object({
  // At least a second: no board can be solved faster than its bulls can be tapped, so 0 only ever
  // means a hand-crafted request. At most a day: this is `increment`ed into a lifetime total, and an
  // unbounded value both makes that total nonsense and, once near `int4`, makes every later
  // completion fail to save. The client clamps to both ends — see `shared/apiLimits.ts`.
  timeSeconds: z.number().int().min(MIN_LEVEL_TIME_SECONDS).max(MAX_LEVEL_TIME_SECONDS),
  /**
   * Bulls placed during this run, folded into the completion instead of arriving as a second
   * request.
   *
   * Optional because the `pagehide` flush still uses `POST /api/statistics/bull-placement` — it
   * fires when the tab goes away, with no completion to travel with.
   */
  bullPlacements: z
    .number()
    .int()
    .min(0)
    .max(MAX_BULL_PLACEMENTS_PER_REQUEST)
    .optional(),
})

export type CompleteLevelInput = z.infer<typeof completeLevelInputSchema>
