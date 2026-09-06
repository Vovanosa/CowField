import { z } from 'zod'

export const accountRoleSchema = z.enum(['admin', 'user'])
export const sessionRoleSchema = z.enum(['admin', 'user', 'guest'])

/**
 * A row of `users`.
 *
 * No `passwordHash` and no `googleId`: Neon Auth owns credentials, the browser authenticates
 * against it directly, and this API only verifies the resulting JWT. Both columns were permanently
 * null and are gone from the database as of
 * `20260906_drop_dead_credential_columns`.
 */
export const userRecordSchema = z.object({
  id: z.string(),
  email: z.string().email(),
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
  // Creation time only. Nothing updates it any more — the per-request write that used to keep it
  // fresh was pure cost, since no code ever read it.
  updatedAt: z.string(),
  /** Absolute expiry, set once at creation. See `auth/sessionExpiry.ts`. */
  expiresAt: z.string(),
})

/**
 * Who the caller is, as `GET /api/auth/me` reports it.
 *
 * **No token.** The caller sent one in the `Authorization` header to get here; echoing it back put
 * a ~1.1 KB JWT in the response body — and in a body the browser was caching, which is not where a
 * bearer token belongs. `actorKey` is not here either: it is a server-side addressing detail
 * (`user:<id>` / `guest:<uuid>`) that nothing on the client has ever read.
 */
export type AuthIdentity = {
  role: SessionRole
  email: string | null
  displayName: string
}

/**
 * `POST /api/auth/guest` additionally returns the token it just minted.
 *
 * This is the one response that legitimately carries a credential: a guest's token exists nowhere
 * else, and the client has no other way to learn it.
 */
export type GuestSession = AuthIdentity & {
  token: string
}

export type AccountRole = z.infer<typeof accountRoleSchema>
export type SessionRole = z.infer<typeof sessionRoleSchema>
export type UserRecord = z.infer<typeof userRecordSchema>
export type SessionRecord = z.infer<typeof sessionRecordSchema>
