import { z } from 'zod'

import { MAX_BULL_PLACEMENTS_PER_REQUEST } from '../../../shared/apiLimits'

export const bullPlacementsInputSchema = z.object({
  // One level session's worth of taps at most. Unbounded, this was `increment`ed straight into the
  // lifetime `int4` counter, so a single request could both invent a total and — once near the
  // column's ceiling — make every later increment fail. See `shared/apiLimits.ts`.
  count: z.number().int().positive().max(MAX_BULL_PLACEMENTS_PER_REQUEST),
})

export type BullPlacementsInput = z.infer<typeof bullPlacementsInputSchema>
