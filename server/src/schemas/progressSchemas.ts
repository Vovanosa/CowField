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
  timeSeconds: z.number().int().nonnegative(),
})

export type CompleteLevelInput = z.infer<typeof completeLevelInputSchema>
