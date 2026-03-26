import { z } from 'zod'

export const bullPlacementsInputSchema = z.object({
  count: z.number().int().positive(),
})

export type BullPlacementsInput = z.infer<typeof bullPlacementsInputSchema>
