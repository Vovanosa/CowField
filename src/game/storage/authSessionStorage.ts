import type { AuthSession } from '../types'
import { buildApiUrl } from './apiBase'
import {
  exchangeNeonCodeForSession,
  getNeonJwtToken,
  getNeonSession,
  resendNeonSignupVerification,
  requestNeonPasswordReset,
  resetNeonPassword,
  signInWithNeonGoogle,
  signInWithNeonPassword,
  signOutNeon,
  signUpWithNeonPassword,
} from './neonAuthClient'

const AUTH_API_BASE = buildApiUrl('/api/auth')
const GUEST_SESSION_TOKEN_STORAGE_KEY = 'cowfield.guest-session-token'
const SESSION_ROLE_STORAGE_KEY = 'cowfield.auth-session-role'

type PasswordResetRequestResponse = {
  sent: boolean
}

type PasswordResetResponse = {
  reset: boolean
}

function buildHeaders(init?: HeadersInit) {
  return {
    'Content-Type': 'application/json',
    ...(init ?? {}),
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    headers: buildHeaders(init?.headers),
    ...init,
  })

  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const payload = (await response.json()) as { message?: string }
      message = payload.message ?? message
    } catch {
      // ignore parse error
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getStoredSessionToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(GUEST_SESSION_TOKEN_STORAGE_KEY)
}

export function setStoredSessionToken(token: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(GUEST_SESSION_TOKEN_STORAGE_KEY, token)
}

export function clearStoredSessionToken() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(GUEST_SESSION_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(SESSION_ROLE_STORAGE_KEY)
}

export function getStoredSessionRole() {
  if (typeof window === 'undefined') {
    return null
  }

  const role = window.localStorage.getItem(SESSION_ROLE_STORAGE_KEY)

  return role === 'admin' || role === 'user' || role === 'guest' ? role : null
}

function setStoredSessionRole(role: AuthSession['role']) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SESSION_ROLE_STORAGE_KEY, role)
}

export async function buildAuthenticatedHeaders(init?: HeadersInit) {
  const token =
    getStoredSessionRole() === 'guest'
      ? getStoredSessionToken()
      : await getNeonJwtToken()

  return buildHeaders({
    ...(init ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })
}

async function resetAuthState() {
  clearStoredSessionToken()

  try {
    await signOutNeon()
  } catch {
    // Ignore stale or missing Neon session state.
  }
}

export async function login(email: string, password: string) {
  await resetAuthState()
  await signInWithNeonPassword(email, password)
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Failed to restore session after login.')
  }

  return session
}

export async function register(email: string, password: string) {
  await resetAuthState()
  await signUpWithNeonPassword(email, password)

  const session = await getCurrentSession()

  if (session) {
    return session
  }

  throw new Error('EMAIL_VERIFICATION_REQUIRED')
}

export async function loginAsGuest() {
  const session = await requestJson<AuthSession>('/guest', {
    method: 'POST',
  })

  setStoredSessionToken(session.token)
  setStoredSessionRole(session.role)
  return session
}

export async function getCurrentSession() {
  if (getStoredSessionRole() === 'guest') {
    const token = getStoredSessionToken()

    if (!token) {
      return null
    }

    try {
      const session = await requestJson<AuthSession>('/me', {
        headers: await buildAuthenticatedHeaders(),
      })

      setStoredSessionRole(session.role)
      return session
    } catch {
      clearStoredSessionToken()
      return null
    }
  }

  try {
    const neonSession = await getNeonSession()

    if (!neonSession) {
      clearStoredSessionToken()
      return null
    }

    const session = await requestJson<AuthSession>('/me', {
      headers: await buildAuthenticatedHeaders(),
    })

    setStoredSessionRole(session.role)
    return session
  } catch {
    clearStoredSessionToken()
    return null
  }
}

export async function logout() {
  try {
    if (getStoredSessionRole() === 'guest') {
      await requestJson<void>('/logout', {
        method: 'POST',
        headers: await buildAuthenticatedHeaders(),
      })
    } else {
      await signOutNeon()
    }
  } finally {
    clearStoredSessionToken()
  }
}

export async function requestPasswordReset(email: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  await requestNeonPasswordReset(email, `${origin}/reset-password`)
  return { sent: true } satisfies PasswordResetRequestResponse
}

export async function resetPassword(token: string, password: string) {
  await resetNeonPassword(token, password)
  return { reset: true } satisfies PasswordResetResponse
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function completeGoogleLogin(code?: string) {
  if (code) {
    await exchangeNeonCodeForSession(code)
  }

  let session = await getCurrentSession()

  // Neon OAuth can finalize the browser session asynchronously on the callback route.
  if (!session) {
    await delay(150)
    session = await getCurrentSession()
  }

  if (!session) {
    await delay(350)
    session = await getCurrentSession()
  }

  if (!session) {
    throw new Error('Google login failed.')
  }

  return session
}

export async function loginWithGoogle() {
  await resetAuthState()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  await signInWithNeonGoogle(`${origin}/auth/google/callback`)
}

export async function resendVerificationEmail(email: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  await resendNeonSignupVerification(email, `${origin}/verify-email?email=${encodeURIComponent(email)}`)
}
