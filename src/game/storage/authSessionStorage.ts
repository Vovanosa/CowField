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
  signUpWithNeonPassword,
  signOutNeon,
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

/**
 * The bearer token for API calls: guests carry one our backend minted and stored, everyone else
 * carries a Neon-issued JWT the backend verifies against Neon's JWKS.
 *
 * `null` means "not signed in" — callers should skip the request rather than send an unauthenticated
 * one that can only 401.
 */
async function resolveBearerToken() {
  return getStoredSessionToken() ?? (await getNeonJwtToken())
}

export async function buildAuthenticatedHeaders(init?: HeadersInit) {
  const token = await resolveBearerToken()

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

/**
 * Sign-in and registration happen against **Neon Auth**, in the browser — Neon owns credentials,
 * email verification, password reset and Google, so keeping all of it in one system avoids two
 * places disagreeing about an account. Our API then identifies the caller from the Neon JWT.
 */
export async function login(email: string, password: string) {
  await resetAuthState()
  await signInWithNeonPassword(email, password)
  const session = await getCurrentSession({ force: true })

  if (!session) {
    throw new Error('Failed to restore session after login.')
  }

  return session
}

export async function register(email: string, password: string) {
  await resetAuthState()
  await signUpWithNeonPassword(email, password)

  const session = await getCurrentSession({ force: true })

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

type SessionLookupOptions = {
  /**
   * Ask even when nothing is remembered locally. Used right after a sign-in, where a session
   * certainly exists but hasn't been recorded yet.
   */
  force?: boolean
}

/**
 * Restores the session by asking our API who the current bearer is.
 *
 * Makes **no network requests at all** when the browser has nothing to restore. Without that,
 * every visit by a signed-out player produced two guaranteed failures: a `401` from Neon's `/token`
 * and then a `401` from our `/me`, called with no `Authorization` header whatsoever.
 */
export async function getCurrentSession({ force = false }: SessionLookupOptions = {}) {
  const storedRole = getStoredSessionRole()

  // Guests authenticate purely with the stored backend token; no token means no guest session.
  if (storedRole === 'guest' && !getStoredSessionToken()) {
    return null
  }

  // Nothing remembered and no sign-in just happened, so there is nobody to look up.
  if (!force && !storedRole) {
    return null
  }

  const token = await resolveBearerToken()

  if (!token) {
    clearStoredSessionToken()
    return null
  }

  try {
    const session = await requestJson<AuthSession>('/me', {
      headers: buildHeaders({ Authorization: `Bearer ${token}` }),
    })

    setStoredSessionRole(session.role)
    return session
  } catch {
    clearStoredSessionToken()
    return null
  }
}

export async function logout() {
  const wasGuest = getStoredSessionRole() === 'guest'

  try {
    // Only guests hold a backend session row; for them the row is the credential, so it has to be
    // deleted. Neon owns the session for everyone else, hence signOutNeon below.
    if (getStoredSessionToken()) {
      await requestJson<void>('/logout', {
        method: 'POST',
        headers: await buildAuthenticatedHeaders(),
      })
    }
  } catch {
    // Clearing locally still signs the player out of this browser.
  } finally {
    if (!wasGuest) {
      try {
        await signOutNeon()
      } catch {
        // Ignore stale or missing Neon session state.
      }
    }

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

  // Wait for Neon to finish establishing the browser session before asking it for a JWT. It
  // finalises asynchronously on the callback route, and asking early makes `/token` answer 401 —
  // which is what used to put a failed request in the waterfall on every Google sign-in.
  let neonSession = await getNeonSession()

  if (!neonSession) {
    await delay(150)
    neonSession = await getNeonSession()
  }

  if (!neonSession) {
    await delay(350)
    neonSession = await getNeonSession()
  }

  if (!neonSession) {
    throw new Error('Google login failed.')
  }

  const session = await getCurrentSession({ force: true })

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
