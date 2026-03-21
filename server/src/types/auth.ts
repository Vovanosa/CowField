import { z } from 'zod'

export const accountRoleSchema = z.enum(['admin', 'user'])
export const sessionRoleSchema = z.enum(['admin', 'user', 'guest'])

export const userRecordSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string().nullable().default(null),
  googleId: z.string().nullable().default(null),
  role: accountRoleSchema,
  displayName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const sessionRecordSchema = z.object({
  token: z.string(),
  actorKey: z.string(),
  role: sessionRoleSchema,
  accountUserId: z.string().nullable(),
  email: z.string().email().nullable(),
  displayName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const passwordResetTokenRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  token: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
})

export type AccountRole = z.infer<typeof accountRoleSchema>
export type SessionRole = z.infer<typeof sessionRoleSchema>
export type UserRecord = z.infer<typeof userRecordSchema>
export type SessionRecord = z.infer<typeof sessionRecordSchema>
export type PasswordResetTokenRecord = z.infer<typeof passwordResetTokenRecordSchema>
