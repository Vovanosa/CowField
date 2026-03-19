import { z } from 'zod'

export const playerSettingsRecordSchema = z.object({
  language: z.enum(['en', 'uk']).default('en'),
  soundEffectsEnabled: z.boolean(),
  soundEffectsVolume: z.number().int().min(0).max(100),
  musicEnabled: z.boolean(),
  musicVolume: z.number().int().min(0).max(100),
  darkModeEnabled: z.boolean(),
  takeYourTimeEnabled: z.boolean(),
  autoPlaceDotsEnabled: z.boolean(),
  updatedAt: z.string(),
})

export type PlayerSettingsRecord = z.infer<typeof playerSettingsRecordSchema>
