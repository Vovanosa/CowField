import { z } from 'zod'

import { INT4_MAX } from '../../../shared/apiLimits'
import { difficultySchema } from '../types/level'

// Bounded to `int4`: `level_number` and `grid_size` are `Int` columns, and `page` becomes an
// `OFFSET`. Without the ceiling a number like `99999999999999` passed validation, reached Prisma and
// came back as a 500 — "our server broke" for what is really "no such level".
export const levelNumberSchema = z.coerce.number().int().positive().max(INT4_MAX)

export const levelParamsSchema = z.object({
  difficulty: difficultySchema,
  levelNumber: levelNumberSchema,
})

export const difficultyParamsSchema = z.object({
  difficulty: difficultySchema,
})

export const levelListQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(INT4_MAX).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const levelRecordInputSchema = z.object({
  difficulty: difficultySchema,
  levelNumber: levelNumberSchema,
  title: z.string().trim().min(1),
  gridSize: z.number().int().positive().max(INT4_MAX),
  colorsByCell: z.array(z.number().int().min(0)),
  cowsByCell: z.array(z.boolean()),
})

export type LevelRecordInput = z.infer<typeof levelRecordInputSchema>
