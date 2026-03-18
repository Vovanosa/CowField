import { z } from 'zod'

import { contentKeySchema } from '../types/content'

export const contentParamsSchema = z.object({
  key: contentKeySchema,
})

export const contentRecordInputSchema = z.object({
  key: contentKeySchema,
  text: z.string().trim().min(1),
})

export type ContentRecordInput = z.infer<typeof contentRecordInputSchema>
