import { z } from 'zod'

import { difficultySchema } from '../types/level'

export const progressParamsSchema = z.object({
  difficulty: difficultySchema,
  levelNumber: z.coerce.number().int().positive(),
})

export const progressDifficultyParamsSchema = z.object({
  difficulty: difficultySchema,
})

export const completeLevelInputSchema = z.object({
  // At least a second: no board can be solved faster than its bulls can be tapped, so 0 only ever
  // means a hand-crafted request. The client clamps to the same floor.
  timeSeconds: z.number().int().min(1),
})

export type CompleteLevelInput = z.infer<typeof completeLevelInputSchema>
