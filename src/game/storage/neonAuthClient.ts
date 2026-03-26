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

export async function getNeonJwtToken() {
  const session = await getNeonSession()

  if (!session) {
    return null
  }

  const tokenSession = session as typeof session & {
    token?: string
    access_token?: string
  }

  return tokenSession.access_token ?? tokenSession.token ?? null
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
