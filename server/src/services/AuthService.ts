import { randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { createHmac } from 'node:crypto'
import { promisify } from 'node:util'

import type {
  LoginInput,
  RegisterInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from '../schemas/authSchemas'
import { HttpError } from '../errors/HttpError'
import type { SessionRecord, UserRecord } from '../types/auth'
import type {
  PasswordResetTokenRepository,
  SessionRepository,
  UserRepository,
} from '../repositories/interfaces'
import {
  enforceConfiguredAdminAccount,
  hashPassword,
  normalizeEmail,
} from '../auth/adminAccount'

const scrypt = promisify(nodeScrypt)

type AuthSessionPayload = {
  token: string
  actorKey: string
  role: 'admin' | 'user' | 'guest'
  email: string | null
  displayName: string
}

type GoogleOAuthConfig = {
  clientId: string
  clientSecret: string
  callbackUrl: string
  frontendCallbackUrl: string
  stateSecret: string
}

type GoogleUserInfo = {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
}

function deriveDisplayNameFromEmail(email: string) {
  const [prefix] = email.split('@')
  return prefix || 'User'
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

function createGoogleState(frontendCallbackUrl: string, stateSecret: string) {
  const payload = JSON.stringify({
    nonce: randomBytes(12).toString('hex'),
    issuedAt: Date.now(),
    frontendCallbackUrl,
  })
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url')
  const signature = createHmac('sha256', stateSecret).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

function verifyGoogleState(state: string, stateSecret: string) {
  const [encodedPayload, signature] = state.split('.')

  if (!encodedPayload || !signature) {
    throw new HttpError(400, 'Google login state is invalid.')
  }

  const expectedSignature = createHmac('sha256', stateSecret).update(encodedPayload).digest('base64url')

  if (signature !== expectedSignature) {
    throw new HttpError(400, 'Google login state is invalid.')
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
    nonce: string
    issuedAt: number
    frontendCallbackUrl: string
  }

  if (!payload.nonce || !payload.issuedAt || !payload.frontendCallbackUrl) {
    throw new HttpError(400, 'Google login state is invalid.')
  }

  if (Date.now() - payload.issuedAt > 1000 * 60 * 10) {
    throw new HttpError(400, 'Google login request expired.')
  }

  return payload
}

function createActorKey(userId: string | null, role: 'admin' | 'user' | 'guest') {
  if (role === 'guest') {
    return `guest:${randomUUID()}`
  }

  return `user:${userId}`
}

export class AuthService {
  private readonly userRepository: UserRepository
  private readonly sessionRepository: SessionRepository
  private readonly passwordResetTokenRepository: PasswordResetTokenRepository
  private readonly adminEmail: string
  private readonly googleOAuthConfig: GoogleOAuthConfig | null

  constructor(
    userRepository: UserRepository,
    sessionRepository: SessionRepository,
    passwordResetTokenRepository: PasswordResetTokenRepository,
    adminEmail: string,
    googleOAuthConfig: GoogleOAuthConfig | null,
  ) {
    this.userRepository = userRepository
    this.sessionRepository = sessionRepository
    this.passwordResetTokenRepository = passwordResetTokenRepository
    this.adminEmail = normalizeEmail(adminEmail)
    this.googleOAuthConfig = googleOAuthConfig
  }

  private async ensureAdminSeed() {
    return enforceConfiguredAdminAccount(this.userRepository, this.adminEmail, 'adminadmin')
  }

  private getRequiredGoogleOAuthConfig() {
    if (!this.googleOAuthConfig) {
      throw new HttpError(503, 'Google login is not configured.')
    }

    return this.googleOAuthConfig
  }

  getGoogleFrontendCallbackUrl() {
    return this.getRequiredGoogleOAuthConfig().frontendCallbackUrl
  }

  private async exchangeGoogleCodeForUserInfo(code: string) {
    const googleOAuthConfig = this.getRequiredGoogleOAuthConfig()
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleOAuthConfig.clientId,
        client_secret: googleOAuthConfig.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: googleOAuthConfig.callbackUrl,
      }),
    })

    if (!tokenResponse.ok) {
      throw new HttpError(401, 'Google login failed.')
    }

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string }

    if (!tokenPayload.access_token) {
      throw new HttpError(401, 'Google login failed.')
    }

    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new HttpError(401, 'Unable to verify Google account.')
    }

    const userInfo = (await userInfoResponse.json()) as GoogleUserInfo

    if (!userInfo.sub || !userInfo.email) {
      throw new HttpError(401, 'Unable to verify Google account.')
    }

    if (userInfo.email_verified === false) {
      throw new HttpError(403, 'Google email must be verified.')
    }

    return userInfo
  }

  getGoogleAuthorizationUrl() {
    const googleOAuthConfig = this.getRequiredGoogleOAuthConfig()
    const state = createGoogleState(
      googleOAuthConfig.frontendCallbackUrl,
      googleOAuthConfig.stateSecret,
    )

    const searchParams = new URLSearchParams({
      client_id: googleOAuthConfig.clientId,
      redirect_uri: googleOAuthConfig.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`
  }

  async loginWithGoogleCallback(code: string, state: string) {
    const googleOAuthConfig = this.getRequiredGoogleOAuthConfig()
    const verifiedState = verifyGoogleState(state, googleOAuthConfig.stateSecret)
    const googleUserInfo = await this.exchangeGoogleCodeForUserInfo(code)
    const normalizedEmail = normalizeEmail(googleUserInfo.email)
    const timestamp = new Date().toISOString()
    let user = await this.userRepository.getByGoogleId(googleUserInfo.sub)

    if (!user) {
      user = await this.userRepository.getByEmail(normalizedEmail)
    }

    if (!user) {
      user = {
        id: randomUUID(),
        email: normalizedEmail,
        passwordHash: null,
        googleId: googleUserInfo.sub,
        role: normalizedEmail === this.adminEmail ? 'admin' : 'user',
        displayName: googleUserInfo.name?.trim() || deriveDisplayNameFromEmail(normalizedEmail),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    } else {
      user = {
        ...user,
        googleId: user.googleId ?? googleUserInfo.sub,
        role: user.email === this.adminEmail ? 'admin' : user.role,
        displayName: googleUserInfo.name?.trim() || user.displayName,
        updatedAt: timestamp,
      }
    }

    await this.userRepository.save(user)

    const session = await this.createSessionPayload(user.role, user.id, user.email, user.displayName)

    return {
      session,
      frontendCallbackUrl: verifiedState.frontendCallbackUrl,
    }
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

  async getSessionByToken(token: string) {
    await this.ensureAdminSeed()

    const session = await this.sessionRepository.getByToken(token)

    if (!session) {
      return null
    }

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

  async logout(token: string) {
    await this.sessionRepository.deleteByToken(token)
  }

  async requestPasswordReset(input: RequestPasswordResetInput) {
    await this.ensureAdminSeed()

    const email = normalizeEmail(input.email)
    const user = await this.userRepository.getByEmail(email)

    if (!user) {
      return { sent: true }
    }

    const timestamp = new Date()
    const resetToken = randomBytes(24).toString('hex')

    await this.passwordResetTokenRepository.save({
      id: randomUUID(),
      userId: user.id,
      email: user.email,
      token: resetToken,
      createdAt: timestamp.toISOString(),
      expiresAt: new Date(timestamp.getTime() + 1000 * 60 * 30).toISOString(),
    })

    console.info(`[auth] Password reset token for ${user.email}: ${resetToken}`)

    return { sent: true }
  }

  async resetPassword(input: ResetPasswordInput) {
    await this.ensureAdminSeed()

    const record = await this.passwordResetTokenRepository.getByToken(input.token)

    if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
      throw new HttpError(400, 'This password reset token is invalid or expired.')
    }

    const user = await this.userRepository.getById(record.userId)

    if (!user) {
      throw new HttpError(404, 'Account not found.')
    }

    const updatedUser: UserRecord = {
      ...user,
      passwordHash: await hashPassword(input.password),
      updatedAt: new Date().toISOString(),
    }

    await this.userRepository.save(updatedUser)
    await this.passwordResetTokenRepository.deleteById(record.id)

    return { reset: true }
  }
}
