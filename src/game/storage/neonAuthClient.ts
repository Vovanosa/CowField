import { createAuthClient } from '@neondatabase/neon-js/auth'
import { SupabaseAuthAdapter } from '@neondatabase/neon-js/auth/vanilla/adapters'

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL?.trim()

const neonAuthClient = NEON_AUTH_URL
  ? createAuthClient(NEON_AUTH_URL, {
      adapter: SupabaseAuthAdapter(),
    })
  : null

function requireNeonAuth() {
  if (!neonAuthClient) {
    throw new Error('Neon Auth is not configured.')
  }

  return neonAuthClient
}

export function isNeonAuthConfigured() {
  return neonAuthClient !== null
}

/**
 * Fetches a **JWT** for the current Neon session, for use as the bearer token against our API.
 *
 * This must not return the session object's `token`: that is an **opaque** Better Auth session
 * token, and our backend cannot verify it — Neon's `/account-info` rejects it and `/get-session`
 * ignores `Authorization` headers. `/token` mints a proper Ed25519-signed JWT instead, which the
 * backend verifies against Neon's published JWKS.
 *
 * `credentials: 'include'` is required — the Neon session lives in a cookie on the Neon domain.
 */
export async function getNeonJwtToken() {
  if (!NEON_AUTH_URL) {
    return null
  }

  try {
    const response = await fetch(`${NEON_AUTH_URL}/token`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as { token?: unknown } | null

    return typeof payload?.token === 'string' && payload.token.length > 0 ? payload.token : null
  } catch {
    return null
  }
}

export async function getNeonSession() {
  if (!neonAuthClient) {
    return null
  }

  const response = await neonAuthClient.getSession()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data?.session ?? null
}

export async function signInWithNeonPassword(email: string, password: string) {
  const auth = requireNeonAuth()
  const response = await auth.signInWithPassword({ email, password })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function signUpWithNeonPassword(email: string, password: string) {
  const auth = requireNeonAuth()
  const response = await auth.signUp({ email, password })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function signInWithNeonGoogle(redirectTo: string) {
  const auth = requireNeonAuth()
  const response = await auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function requestNeonPasswordReset(email: string, redirectTo: string) {
  const auth = requireNeonAuth()
  const response = await auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function resendNeonSignupVerification(email: string, emailRedirectTo: string) {
  const auth = requireNeonAuth()
  const response = await auth.resend({
    email,
    type: 'signup',
    options: {
      emailRedirectTo,
    },
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function resetNeonPassword(token: string, newPassword: string) {
  const auth = requireNeonAuth()
  const resetPassword = (
    auth as typeof auth & {
      resetPassword: (input: { token: string; newPassword: string }) => Promise<{
        data: unknown
        error: { message: string } | null
      }>
    }
  ).resetPassword
  const response = await resetPassword({
    token,
    newPassword,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function exchangeNeonCodeForSession(code: string) {
  const auth = requireNeonAuth()
  const response = await auth.exchangeCodeForSession(code)

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function signOutNeon() {
  if (!neonAuthClient) {
    return
  }

  const response = await neonAuthClient.signOut()

  if (response.error) {
    throw new Error(response.error.message)
  }
}
