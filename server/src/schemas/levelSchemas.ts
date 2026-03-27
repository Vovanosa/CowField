import { z } from 'zod'

import { difficultySchema } from '../types/level'

export const levelNumberSchema = z.coerce.number().int().positive()

export const levelParamsSchema = z.object({
  difficulty: difficultySchema,
  levelNumber: levelNumberSchema,
})

export const difficultyParamsSchema = z.object({
  difficulty: difficultySchema,
})

export const levelListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const levelRecordInputSchema = z.object({
  difficulty: difficultySchema,
  levelNumber: levelNumberSchema,
  title: z.string().trim().min(1),
  gridSize: z.number().int().positive(),
  colorsByCell: z.array(z.number().int().min(0)),
  cowsByCell: z.array(z.boolean()),
})

export type LevelRecordInput = z.infer<typeof levelRecordInputSchema>
