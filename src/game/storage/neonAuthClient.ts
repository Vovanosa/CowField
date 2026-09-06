import { createAuthClient } from '@neondatabase/neon-js/auth'
import { SupabaseAuthAdapter } from '@neondatabase/neon-js/auth/vanilla/adapters'

import { getNeonAuthUrl } from './http/apiBase'

const NEON_AUTH_URL = getNeonAuthUrl()

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

export async function signUpWithNeonPassword(
  email: string,
  password: string,
  emailRedirectTo: string,
) {
  const auth = requireNeonAuth()
  // Points the verification link at our own `/verify-email` route, the same place `resend` sends
  // it. Without this the first email used whatever default the provider is configured with, so the
  // two paths to the same mailbox could land the player in two different places.
  const response = await auth.signUp({ email, password, options: { emailRedirectTo } })

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
