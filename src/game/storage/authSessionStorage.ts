import type { AuthSession } from '../types'
import {
  ApiError,
  buildApiUrl,
  buildAuthenticatedHeaders,
  clearBearerToken,
  clearStoredSessionToken,
  getBearerToken,
  getStoredSessionRole,
  getStoredSessionToken,
  requestJson as requestApiJson,
  setStoredSessionRole,
  setStoredSessionToken,
} from './http'
import {
  exchangeNeonCodeForSession,
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

type PasswordResetRequestResponse = {
  sent: boolean
}

type PasswordResetResponse = {
  reset: boolean
}

// Re-exported so the many existing importers keep working. The definitions moved to `http/`, where
// `bearer.ts` can read them without importing this module back.
export {
  buildAuthenticatedHeaders,
  clearStoredSessionToken,
  getStoredSessionRole,
  getStoredSessionToken,
  setStoredSessionToken,
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestApiJson<T>(`${AUTH_API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
}

async function resetAuthState() {
  clearStoredSessionToken()
  clearBearerToken()

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
  // A new Neon session means a new JWT; anything cached belongs to whoever was signed in before.
  clearBearerToken()
  const session = await getCurrentSession({ force: true })

  if (!session) {
    throw new Error('Failed to restore session after login.')
  }

  return session
}

export async function register(email: string, password: string) {
  await resetAuthState()
  await signUpWithNeonPassword(email, password)
  clearBearerToken()

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

  // A guest's stored token takes precedence over any cached Neon JWT, but drop the cache anyway so
  // nothing from a previous account can be sent if the guest token is later cleared.
  clearBearerToken()
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
 *
 * **Only a refusal erases the stored session.** This used to `catch { clearStoredSessionToken() }`
 * around everything, and `clearStoredSessionToken` drops the remembered *role* as well as the token
 * — so a single load while offline, or during one 500, left nothing to restore from, and the guard
 * above then made every later visit return `null` without even asking. The sign-out was permanent
 * and silent. Now a failure to reach the server leaves the browser's memory of the session intact,
 * and the next load picks it back up.
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

  let token: string | null

  try {
    token = await getBearerToken()
  } catch {
    // Could not ask Neon. Says nothing about whether the session is valid — keep it.
    return null
  }

  if (!token) {
    // Neon answered, and the answer was that there is no session here.
    clearStoredSessionToken()
    return null
  }

  try {
    const session = await requestJson<AuthSession>('/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    setStoredSessionRole(session.role)
    return session
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      clearStoredSessionToken()
      clearBearerToken()
    }

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
    clearBearerToken()
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

  // The session Neon just established is a different identity from anything cached.
  clearBearerToken()

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
