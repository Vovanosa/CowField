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
