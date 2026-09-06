import { randomBytes, randomUUID } from 'node:crypto'

import type { SessionRecord, UserRecord } from '../types/auth'
import type {
  SessionRepository,
  UserRepository,
} from '../repositories/interfaces'
import { normalizeEmail } from '../auth/adminAccount'
import { verifyNeonJwt, type NeonJwtClaims } from '../auth/neonJwt'
import { getSessionExpiry } from '../auth/sessionExpiry'

type AuthSessionPayload = {
  token: string
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

  async createGuestSession(): Promise<AuthSessionPayload> {
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

    return {
      token: session.token,
      actorKey: session.actorKey,
      role: session.role,
      email: session.email,
      displayName: session.displayName,
    }
  }

  private async syncNeonUser(claims: NeonJwtClaims) {
    const normalizedEmail = claims.email ? normalizeEmail(claims.email) : `${claims.sub}@neon.local`
    const existingUserById = await this.userRepository.getById(claims.sub)
    const existingUserByEmail = claims.email
      ? await this.userRepository.getByEmail(normalizedEmail)
      : null
    const existingUser = existingUserById ?? existingUserByEmail
    const timestamp = new Date().toISOString()
    const nextUser: UserRecord = {
      id: existingUser?.id ?? claims.sub,
      email: normalizedEmail,
      passwordHash: existingUser?.passwordHash ?? null,
      googleId: existingUser?.googleId ?? null,
      role: normalizedEmail === this.adminEmail ? 'admin' : 'user',
      displayName:
        typeof claims.name === 'string' && claims.name.trim()
          ? claims.name.trim()
          : deriveDisplayNameFromEmail(normalizedEmail),
      createdAt: existingUser?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    await this.userRepository.save(nextUser)

    return nextUser
  }

  async getSessionByToken(token: string) {
    // A read, and only a read. This used to re-`save` the row with a fresh `updatedAt` on every
    // single authenticated request — a write per API call, for a column nothing ever read. Session
    // lifetime is now an absolute `expiresAt` set at creation, which needs no touching here; the
    // repository refuses and deletes an expired row itself.
    const session = await this.sessionRepository.getByToken(token)

    if (session) {
      return {
        token: session.token,
        actorKey: session.actorKey,
        role: session.role,
        email: session.email,
        displayName: session.displayName,
      }
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
      token,
      actorKey: `user:${user.id}`,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    }
  }

  async logout(token: string) {
    await this.sessionRepository.deleteByToken(token)
  }
}
