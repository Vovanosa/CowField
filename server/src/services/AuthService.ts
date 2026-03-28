import { randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
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
import {
  enforceConfiguredAdminAccount,
  hashPassword,
  normalizeEmail,
} from '../auth/adminAccount'
import {
  extractNeonUser,
  extractNeonToken,
  getNeonAuthFrontendOrigin,
  requestNeonPasswordReset,
  resetNeonPassword,
  signInWithNeonPassword,
  signUpWithNeonPassword,
} from '../auth/neonAuthClient'

const scrypt = promisify(nodeScrypt)

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

type NeonSessionResponse = {
  user: {
    id: string
    email: string
    name: string
  }
  session: {
    token: string
  }
} | null

type NeonAccountInfoResponse = {
  user?: {
    id?: string
    sub?: string
    email?: string
    name?: string
  } | null
  data?: {
    id?: string
    sub?: string
    email?: string
    name?: string
  } | null
} | null

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

async function verifyPassword(password: string, passwordHash: string) {
  const [salt, hash] = passwordHash.split(':')

  if (!salt || !hash) {
    return false
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const expectedHash = Buffer.from(hash, 'hex')

  if (derivedKey.length !== expectedHash.length) {
    return false
  }

  return timingSafeEqual(derivedKey, expectedHash)
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

  private async ensureAdminSeed() {
    return enforceConfiguredAdminAccount(this.userRepository, this.adminEmail, 'adminadmin')
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

  async register(input: RegisterInput) {
    await this.ensureAdminSeed()

    const email = normalizeEmail(input.email)
    const existingUser = await this.userRepository.getByEmail(email)

    if (existingUser) {
      throw new HttpError(409, 'An account with that email already exists.')
    }

    const timestamp = new Date().toISOString()
    const user: UserRecord = {
      id: randomUUID(),
      email,
      passwordHash: await hashPassword(input.password),
      googleId: null,
      role: 'user',
      displayName: deriveDisplayNameFromEmail(email),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await this.userRepository.save(user)

    return this.createSessionPayload(user.role, user.id, user.email, user.displayName)
  }

  async login(input: LoginInput) {
    await this.ensureAdminSeed()

    const email = normalizeEmail(input.email)
    const user = await this.userRepository.getByEmail(email)

    if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new HttpError(401, 'Incorrect email or password.')
    }

    return this.createSessionPayload(user.role, user.id, user.email, user.displayName)
  }

  async createGuestSession() {
    await this.ensureAdminSeed()
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

      const fallbackJwtUser = this.getFallbackJwtUser(token)

      if (fallbackJwtUser) {
        return this.createStoredNeonSession(token, {
          id: fallbackJwtUser.sub,
          email: fallbackJwtUser.email,
          name: fallbackJwtUser.name,
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

      const fallbackJwtUser = this.getFallbackJwtUser(token)

      if (fallbackJwtUser) {
        return this.createStoredNeonSession(token, {
          id: fallbackJwtUser.sub,
          email: fallbackJwtUser.email,
          name: fallbackJwtUser.name,
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

  private async getNeonAccountInfoForToken(token: string): Promise<NeonAccountInfoResponse> {
    if (!this.neonAuthUrl) {
      return null
    }

    const response = await fetch(`${this.neonAuthUrl}/account-info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as NeonAccountInfoResponse
  }

  private async getNeonSessionForToken(token: string): Promise<NeonSessionResponse> {
    if (!this.neonAuthUrl) {
      return null
    }

    const response = await fetch(`${this.neonAuthUrl}/get-session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as NeonSessionResponse
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

  private getFallbackJwtUser(token: string) {
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
    const session = await this.sessionRepository.getByToken(token)

    if (session) {
      await this.sessionRepository.save({
        ...session,
        updatedAt: new Date().toISOString(),
      })

      return {
        token: session.token,
        actorKey: session.actorKey,
        role: session.role,
        email: session.email,
        displayName: session.displayName,
      }
    }

    const neonAccountInfo = await this.getNeonAccountInfoForToken(token)
    const accountUser = neonAccountInfo?.user ?? neonAccountInfo?.data ?? null

    if (accountUser?.id || accountUser?.sub) {
      const user = await this.syncNeonUser({
        sub: accountUser.id ?? accountUser.sub ?? '',
        aud: 'neon-auth',
        email: accountUser.email,
        name: accountUser.name,
      })

      return {
        token,
        actorKey: `user:${user.id}`,
        role: user.role,
        email: user.email,
        displayName: user.displayName,
      }
    }

    const neonSession = await this.getNeonSessionForToken(token)

    if (neonSession?.user?.id) {
      const user = await this.syncNeonUser({
        sub: neonSession.user.id,
        aud: 'neon-auth',
        email: neonSession.user.email,
        name: neonSession.user.name,
      })

      return {
        token,
        actorKey: `user:${user.id}`,
        role: user.role,
        email: user.email,
        displayName: user.displayName,
      }
    }

    const fallbackJwtUser = this.getFallbackJwtUser(token)

    if (!fallbackJwtUser) {
      return null
    }

    const user = await this.syncNeonUser(fallbackJwtUser)

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
