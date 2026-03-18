import { z } from 'zod'

export const contentKeySchema = z.enum(['home', 'about', 'settings'])

export type ContentKey = z.infer<typeof contentKeySchema>

export type ContentRecord = {
  key: ContentKey
  text: string
  updatedAt: string
}
