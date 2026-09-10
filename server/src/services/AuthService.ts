import { randomBytes, randomUUID } from 'node:crypto'

import type { GuestSession, SessionRecord, UserRecord } from '../types/auth'
import type {
  SessionRepository,
  UserRepository,
} from '../repositories/interfaces'
import { normalizeEmail } from '../auth/adminAccount'
import { verifyNeonJwt, type NeonJwtClaims } from '../auth/neonJwt'
import { getSessionExpiry } from '../auth/sessionExpiry'

/**
 * What the API resolves a bearer token into, for its own use.
 *
 * `actorKey` addresses the player in every repository call, so it belongs here — but it is not part
 * of any response. Neither is the token: nothing server-side reads it back off the actor.
 */
type ResolvedActor = {
  actorKey: string
  role: 'admin' | 'user' | 'guest'
  email: string | null
  displayName: string
}

function deriveDisplayNameFromEmail(email: string) {
  const [prefix] = email.split('@')
  return prefix || 'User'
}

/**
 * How long a resolved user is trusted without re-reading it.
 *
 * Short on purpose. The only things that can change underneath it are the display name and the role,
 * and a minute of staleness costs nothing against the queries it saves on **every authenticated
 * request**.
 *
 * **Why there is no invalidation function.** Audited 2026-09-10, looking for the opposite answer:
 * nothing in this process can change a role or delete a user while a request is being served.
 * The role is not stored state that someone flips — it is **derived** on every sync from
 * `normalizedEmail === this.adminEmail`, so it can only differ if `BULLPEN_ADMIN_EMAIL` changes,
 * which is an env change and therefore a restart. `enforceConfiguredAdminAccount` runs in
 * `index.ts`, `await`ed *before* `app.listen`, so the cache is still empty when it finishes. And
 * there is no role-change endpoint, no account-deletion endpoint, and no write to `users` at all
 * besides the conditional upsert below. So the only way a row changes underneath this map is an
 * out-of-band edit to the database — visible within 60 seconds anyway, or immediately if the API is
 * restarted, which empties an in-process `Map` by definition.
 *
 * A `clearAuthUserCache()` export used to sit here for exactly that scenario. It had no callers and
 * no caller was possible, so it was a lever attached to nothing — deleted rather than left to read
 * as though something invalidated the cache. **If a role-change or delete-account endpoint is ever
 * added, it has to bust this map**, and that is the moment to bring the function back.
 */
const USER_CACHE_TTL_MS = 60_000

type CachedUser = {
  user: UserRecord
  expiresAtMs: number
}

/**
 * Verified JWT subject → the user row it maps to.
 *
 * Without this, every authenticated request did two reads and an **upsert** of the `users` row —
 * a write per API call, for a row that almost never changes. It measured as ≈100 queries and 25
 * writes out of a 152-query session. This is the same defect the per-request session `UPDATE` had,
 * reintroduced on a different table; the fix is the same shape, and the write below is now
 * conditional on something actually differing.
 *
 * Keyed on `sub`, which the JWKS signature has already proven.
 */
const userCacheBySubject = new Map<string, CachedUser>()

function readCachedUser(subject: string) {
  const cached = userCacheBySubject.get(subject)

  if (!cached) {
    return null
  }

  if (Date.now() >= cached.expiresAtMs) {
    userCacheBySubject.delete(subject)
    return null
  }

  return cached.user
}

function cacheUser(subject: string, user: UserRecord) {
  // Bounded so a stream of distinct subjects cannot grow it without limit. The map is small and
  // insertion-ordered, so dropping the oldest entry is enough.
  if (userCacheBySubject.size >= 1000) {
    const oldestSubject = userCacheBySubject.keys().next().value

    if (oldestSubject !== undefined) {
      userCacheBySubject.delete(oldestSubject)
    }
  }

  userCacheBySubject.set(subject, {
    user,
    expiresAtMs: Date.now() + USER_CACHE_TTL_MS,
  })
}

/** The fields a JWT can actually change. Everything else on the row is ours. */
function isUserUpToDate(existing: UserRecord, next: UserRecord) {
  return (
    existing.id === next.id &&
    existing.email === next.email &&
    existing.role === next.role &&
    existing.displayName === next.displayName
  )
}

/**
 * Whether a bearer token is shaped like a JWT rather than a guest session token.
 *
 * Only a shape check, and it decides **which store to look in**, never whether to trust anything:
 * a token that gets this far still has its signature verified against Neon's JWKS.
 */
function looksLikeJwt(token: string) {
  return token.split('.').length === 3
}

/**
 * Identity for the API.
 *
 * There are exactly **two** kinds of caller and nothing in between:
 *
 * - a **guest**, holding an opaque token this service minted, whose row in `sessions` *is* the
 *   credential;
 * - a **Neon account**, holding a JWT that Neon issued to the browser, which is verified against
 *   Neon's JWKS on every request.
 *
 * The API deliberately no longer proxies credentials. It used to expose `/login`, `/register`,
 * `/request-password-reset` and `/reset-password`, which took an email and password, forwarded them
 * to Neon and stored the returned token as a session row. Nothing in the app ever called them — the
 * browser talks to Neon directly — and `/request-password-reset` let the caller choose the host of
 * the password-reset link. Removing them removed that, the stored-Neon-session path, and the
 * unverified `decodeJwtPayload` those endpoints relied on.
 */
export class AuthService {
  private readonly userRepository: UserRepository
  private readonly sessionRepository: SessionRepository
  private readonly adminEmail: string
  private readonly neonAuthUrl: string | null

  constructor(
    userRepository: UserRepository,
    sessionRepository: SessionRepository,
    adminEmail: string,
    neonAuthUrl: string | null,
  ) {
    this.userRepository = userRepository
    this.sessionRepository = sessionRepository
    this.adminEmail = normalizeEmail(adminEmail)
    this.neonAuthUrl = neonAuthUrl?.trim() || null
  }

  async createGuestSession(): Promise<GuestSession> {
    const timestamp = new Date().toISOString()
    const session: SessionRecord = {
      token: randomBytes(32).toString('hex'),
      actorKey: `guest:${randomUUID()}`,
      role: 'guest',
      accountUserId: null,
      email: null,
      displayName: 'Guest',
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: getSessionExpiry('guest').toISOString(),
    }

    await this.sessionRepository.save(session)

    // The token is the point of this response: a guest's credential exists nowhere else.
    return {
      token: session.token,
      role: session.role,
      email: session.email,
      displayName: session.displayName,
    }
  }

  /**
   * The user behind a verified JWT — from cache when possible, and **written only when something
   * differs**.
   *
   * The two reads and the unconditional `save` below used to run on every authenticated request.
   * They now run at most once a minute per player, and the write only when the JWT actually carries
   * a changed email, name or role.
   */
  private async syncNeonUser(claims: NeonJwtClaims) {
    const cachedUser = readCachedUser(claims.sub)

    if (cachedUser) {
      return cachedUser
    }

    const normalizedEmail = claims.email ? normalizeEmail(claims.email) : `${claims.sub}@neon.local`
    const [existingUserById, existingUserByEmail] = await Promise.all([
      this.userRepository.getById(claims.sub),
      claims.email ? this.userRepository.getByEmail(normalizedEmail) : Promise.resolve(null),
    ])
    const existingUser = existingUserById ?? existingUserByEmail
    const timestamp = new Date().toISOString()
    const nextUser: UserRecord = {
      id: existingUser?.id ?? claims.sub,
      email: normalizedEmail,
      role: normalizedEmail === this.adminEmail ? 'admin' : 'user',
      displayName:
        typeof claims.name === 'string' && claims.name.trim()
          ? claims.name.trim()
          : deriveDisplayNameFromEmail(normalizedEmail),
      createdAt: existingUser?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    // A row that already says all this needs no write. `updatedAt` alone is not a reason: nothing
    // reads it, and bumping it was the entire content of most of these writes.
    if (!existingUser || !isUserUpToDate(existingUser, nextUser)) {
      await this.userRepository.save(nextUser)
    }

    cacheUser(claims.sub, nextUser)

    return nextUser
  }

  async getSessionByToken(token: string) {
    // Guest tokens are 64 hex characters from `randomBytes(32)`; a JWT is three base64url segments
    // separated by dots. They cannot be mistaken for each other, so the shape says which table — if
    // any — to look in.
    //
    // Worth the check: a browser login never creates a session row, so for every `admin`/`user`
    // request this lookup ran and returned nothing. One guaranteed-empty query per API call.
    if (!looksLikeJwt(token)) {
      // A read, and only a read. This used to re-`save` the row with a fresh `updatedAt` on every
      // single authenticated request — a write per API call, for a column nothing ever read. Session
      // lifetime is now an absolute `expiresAt` set at creation, which needs no touching here; the
      // repository refuses and deletes an expired row itself.
      const session = await this.sessionRepository.getByToken(token)

      if (!session) {
        return null
      }

      return {
        actorKey: session.actorKey,
        role: session.role,
        email: session.email,
        displayName: session.displayName,
      } satisfies ResolvedActor
    }

    // Otherwise it must be a Neon-issued JWT, verified against Neon's JWKS. There is deliberately
    // no unverified path: Neon offers no way to validate the opaque session token it gives the
    // browser, so a cryptographic check is the only thing that can identify a caller here.
    const claims = await verifyNeonJwt(token, this.neonAuthUrl)

    if (!claims) {
      return null
    }

    const user = await this.syncNeonUser(claims)

    return {
      actorKey: `user:${user.id}`,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    } satisfies ResolvedActor
  }

  async logout(token: string) {
    await this.sessionRepository.deleteByToken(token)
  }
}
