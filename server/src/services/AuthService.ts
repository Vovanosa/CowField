import { randomBytes, randomUUID } from 'node:crypto'
import type {
  LoginInput,
  RegisterInput,
} from '../schemas/authSchemas'
import { HttpError } from '../errors/HttpError'
import type { SessionRecord, UserRecord } from '../types/auth'
import type {
  SessionRepository,
  UserRepository,
} from '../repositories/interfaces'
import { normalizeEmail } from '../auth/adminAccount'
import {
  extractNeonUser,
  extractNeonToken,
  getNeonAuthFrontendOrigin,
  NeonAuthRequestError,
  requestNeonPasswordReset,
  resetNeonPassword,
  signInWithNeonPassword,
  signUpWithNeonPassword,
} from '../auth/neonAuthClient'
import { verifyNeonJwt } from '../auth/neonJwt'
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

type NeonJwtPayload = {
  sub: string
  aud: string
  email?: string
  name?: string
  iss?: string
}

function decodeJwtPayload(token: string): NeonJwtPayload | null {
  const segments = token.split('.')

  if (segments.length < 2) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8')) as {
      sub?: unknown
      aud?: unknown
      email?: unknown
      name?: unknown
      iss?: unknown
      exp?: unknown
    }

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return null
    }

    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      return null
    }

    const audience =
      typeof payload.aud === 'string'
        ? payload.aud
        : Array.isArray(payload.aud) && typeof payload.aud[0] === 'string'
          ? payload.aud[0]
          : 'neon-auth'

    return {
      sub: payload.sub,
      aud: audience,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      iss: typeof payload.iss === 'string' ? payload.iss : undefined,
    }
  } catch {
    return null
  }
}

function createActorKey(userId: string | null, role: 'admin' | 'user' | 'guest') {
  if (role === 'guest') {
    return `guest:${randomUUID()}`
  }

  return `user:${userId}`
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && typeof error.message === 'string') {
    return error.message
  }

  return 'Unexpected server error.'
}

/**
 * The upstream HTTP status behind a Neon Auth failure, or `null` if there isn't one.
 *
 * Two shapes reach here. Neon's SDK **throws** a plain `Error` for any non-2xx, with `status` and
 * `statusText` attached as own properties — that is the common path. It can also *return*
 * `{ error }` on a 2xx, which `neonAuthClient` wraps in `NeonAuthRequestError`. Reading `status`
 * structurally covers both without depending on which one fired.
 */
function getUpstreamStatus(error: unknown): number | null {
  if (error instanceof NeonAuthRequestError) {
    return error.status
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const { status } = error as { status?: unknown }
    return typeof status === 'number' ? status : null
  }

  return null
}

function mapNeonAuthError(error: unknown): never {
  const message = getErrorMessage(error)

  if (message === 'Invalid email or password') {
    throw new HttpError(401, 'Incorrect email or password.')
  }

  if (message === 'User already exists') {
    throw new HttpError(409, 'An account with that email already exists.')
  }

  if (message === 'Email not verified') {
    throw new HttpError(401, 'Please verify your email before logging in.')
  }

  if (message === 'Invalid origin') {
    throw new HttpError(500, 'Mobile auth origin is not configured correctly.')
  }

  // Neon throttles sign-in attempts too, at roughly the same rate we do. Without this the upstream
  // 429 fell through to the default below and reached the player as a **500** — "our server broke"
  // instead of "slow down", which is both untrue and unactionable.
  if (getUpstreamStatus(error) === 429) {
    throw new HttpError(429, 'Too many attempts. Wait a few minutes and try again.')
  }

  throw error instanceof HttpError ? error : new HttpError(500, message)
}

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

  private async createSessionPayload(
    role: 'admin' | 'user' | 'guest',
    accountUserId: string | null,
    email: string | null,
    displayName: string,
    actorKey?: string,
  ): Promise<AuthSessionPayload> {
    const timestamp = new Date().toISOString()
    const token = randomBytes(32).toString('hex')
    const session: SessionRecord = {
      token,
      actorKey: actorKey ?? createActorKey(accountUserId, role),
      role,
      accountUserId,
      email,
      displayName,
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: getSessionExpiry(role).toISOString(),
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

  async createGuestSession() {
    return this.createSessionPayload('guest', null, null, 'Guest')
  }

  private async createStoredNeonSession(
    token: string,
    payload: {
      id: string
      email?: string
      name?: string
    },
  ) {
    const user = await this.syncNeonUser({
      sub: payload.id,
      aud: 'neon-auth',
      email: payload.email,
      name: payload.name,
    })

    const timestamp = new Date().toISOString()
    const session: SessionRecord = {
      token,
      actorKey: `user:${user.id}`,
      role: user.role,
      accountUserId: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: getSessionExpiry(user.role).toISOString(),
    }

    await this.sessionRepository.save(session)

    return {
      token: session.token,
      actorKey: session.actorKey,
      role: session.role,
      email: session.email,
      displayName: session.displayName,
    } satisfies AuthSessionPayload
  }

  async loginWithNeonPassword(input: LoginInput) {
    try {
      const data = await signInWithNeonPassword(input.email, input.password)
      const token = extractNeonToken(data)
      const user = extractNeonUser(data)

      if (!token) {
        throw new HttpError(500, 'Failed to restore Neon session after login.')
      }

      if (user) {
        return this.createStoredNeonSession(token, user)
      }

      const issuedTokenClaims = this.readIssuedTokenClaims(token)

      if (issuedTokenClaims) {
        return this.createStoredNeonSession(token, {
          id: issuedTokenClaims.sub,
          email: issuedTokenClaims.email,
          name: issuedTokenClaims.name,
        })
      }

      const session = await this.getSessionByToken(token)

      if (session) {
        return session
      }

      throw new HttpError(500, 'Failed to restore user session after login.')
    } catch (error) {
      mapNeonAuthError(error)
    }
  }

  async registerWithNeonPassword(input: RegisterInput) {
    try {
      const redirectTo = `${getNeonAuthFrontendOrigin()}/login?verified=1&email=${encodeURIComponent(normalizeEmail(input.email))}`
      const data = await signUpWithNeonPassword(input.email, input.password, redirectTo)
      const token = extractNeonToken(data)
      const user = extractNeonUser(data)

      if (!token) {
        throw new HttpError(409, 'EMAIL_VERIFICATION_REQUIRED')
      }

      if (user) {
        return this.createStoredNeonSession(token, user)
      }

      const issuedTokenClaims = this.readIssuedTokenClaims(token)

      if (issuedTokenClaims) {
        return this.createStoredNeonSession(token, {
          id: issuedTokenClaims.sub,
          email: issuedTokenClaims.email,
          name: issuedTokenClaims.name,
        })
      }

      const session = await this.getSessionByToken(token)

      if (session) {
        return session
      }

      throw new HttpError(500, 'Failed to restore user session after signup.')
    } catch (error) {
      mapNeonAuthError(error)
    }
  }

  async requestNeonPasswordReset(email: string, frontendOrigin?: string) {
    try {
      const safeFrontendOrigin =
        frontendOrigin?.trim() && /^https?:\/\//.test(frontendOrigin)
          ? frontendOrigin.trim()
          : getNeonAuthFrontendOrigin()

      await requestNeonPasswordReset(email, `${safeFrontendOrigin}/reset-password`)
    } catch (error) {
      mapNeonAuthError(error)
    }
  }

  async resetNeonPassword(token: string, password: string) {
    try {
      await resetNeonPassword(token, password)
    } catch (error) {
      mapNeonAuthError(error)
    }
  }

  private async syncNeonUser(payload: NeonJwtPayload) {
    const normalizedEmail = payload.email ? normalizeEmail(payload.email) : `${payload.sub}@neon.local`
    const existingUserById = await this.userRepository.getById(payload.sub)
    const existingUserByEmail = payload.email
      ? await this.userRepository.getByEmail(normalizedEmail)
      : null
    const existingUser = existingUserById ?? existingUserByEmail
    const timestamp = new Date().toISOString()
    const nextUser: UserRecord = {
      id: existingUser?.id ?? payload.sub,
      email: normalizedEmail,
      passwordHash: existingUser?.passwordHash ?? null,
      googleId: existingUser?.googleId ?? null,
      role: normalizedEmail === this.adminEmail ? 'admin' : 'user',
      displayName:
        typeof payload.name === 'string' && payload.name.trim()
          ? payload.name.trim()
          : deriveDisplayNameFromEmail(normalizedEmail),
      createdAt: existingUser?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    await this.userRepository.save(nextUser)

    return nextUser
  }

  /**
   * Reads the claims out of a token WITHOUT verifying its signature.
   *
   * Only ever call this on a token Neon Auth just issued to us over an authenticated call
   * (login/register), where the transport is the proof and the claims are just being unpacked.
   * Never call it on a token supplied by a client — see the comment in `getSessionByToken`.
   */
  private readIssuedTokenClaims(token: string) {
    const payload = decodeJwtPayload(token)

    if (!payload?.sub) {
      return null
    }

    if (this.neonAuthUrl && payload.iss) {
      try {
        if (new URL(payload.iss).host !== new URL(this.neonAuthUrl).host) {
          return null
        }
      } catch {
        return null
      }
    }

    return payload
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

    const user = await this.syncNeonUser({
      sub: claims.sub,
      aud: 'neon-auth',
      email: claims.email,
      name: claims.name,
    })

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
