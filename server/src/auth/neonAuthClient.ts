import { createAuthClient } from '@neondatabase/neon-js/auth'

type SessionCandidate = {
  access_token?: string
  token?: string
  refresh_token?: string | null
  session?: SessionCandidate | null
}

type UserCandidate = {
  id?: string
  sub?: string
  email?: string
  name?: string
  user?: UserCandidate | null
  data?: UserCandidate | null
}

type BetterAuthSessionResponse = {
  data?: {
    session?: SessionCandidate | null
    user?: {
      id: string
      email: string
      name?: string
    } | null
  } | null
  error?: {
    message: string
  } | null
}

type PasswordResetResponse = {
  data?: unknown
  error?: { message: string } | null
}

type NeonAuthClient = {
  signIn: {
    email: (input: { email: string; password: string }) => Promise<BetterAuthSessionResponse>
  }
  signUp:
    | {
        email: (input: {
          email: string
          password: string
          name: string
          callbackURL: string
        }) => Promise<BetterAuthSessionResponse>
      }
    | ((input: {
        email: string
        password: string
        name: string
        callbackURL: string
      }) => Promise<BetterAuthSessionResponse>)
  requestPasswordReset?: (input: {
    email: string
    redirectTo: string
  }) => Promise<PasswordResetResponse>
  resetPasswordForEmail?: (
    email: string,
    options: { redirectTo: string },
  ) => Promise<PasswordResetResponse>
  resetPassword: (input: { token: string; newPassword: string }) => Promise<PasswordResetResponse>
}

function getPreferredFrontendOrigin() {
  const configuredOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins[0]
  }

  return 'https://cowfieldvercel.vercel.app'
}

let neonAuthClient: unknown | null | undefined = undefined

function getNeonAuthUrl() {
  return process.env.NEON_AUTH_URL?.trim() ?? process.env.VITE_NEON_AUTH_URL?.trim() ?? null
}

function requireNeonAuth(): NeonAuthClient {
  if (neonAuthClient === undefined) {
    const neonAuthUrl = getNeonAuthUrl()

    neonAuthClient = neonAuthUrl
      ? createAuthClient(neonAuthUrl, {
          fetchOptions: {
            headers: {
              Origin: getPreferredFrontendOrigin(),
              Referer: `${getPreferredFrontendOrigin()}/`,
            },
          },
        } as never)
      : null
  }

  if (!neonAuthClient) {
    throw new Error('Neon Auth is not configured.')
  }

  return neonAuthClient as NeonAuthClient
}

export function getNeonAuthFrontendOrigin() {
  return getPreferredFrontendOrigin()
}

export function extractNeonToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as SessionCandidate

  if (typeof candidate.access_token === 'string' && candidate.access_token.length > 0) {
    return candidate.access_token
  }

  if (typeof candidate.token === 'string' && candidate.token.length > 0) {
    return candidate.token
  }

  if (candidate.session) {
    return extractNeonToken(candidate.session)
  }

  return null
}

export function extractNeonUser(payload: unknown): {
  id: string
  email?: string
  name?: string
} | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as UserCandidate
  const id = typeof candidate.id === 'string' && candidate.id.length > 0
    ? candidate.id
    : typeof candidate.sub === 'string' && candidate.sub.length > 0
      ? candidate.sub
      : null

  if (id) {
    return {
      id,
      email: typeof candidate.email === 'string' ? candidate.email : undefined,
      name: typeof candidate.name === 'string' ? candidate.name : undefined,
    }
  }

  if (candidate.user) {
    return extractNeonUser(candidate.user)
  }

  if (candidate.data) {
    return extractNeonUser(candidate.data)
  }

  return null
}

export async function signInWithNeonPassword(email: string, password: string) {
  const auth = requireNeonAuth()
  const response = await auth.signIn.email({ email, password }) as BetterAuthSessionResponse

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data?.session ?? response.data ?? null
}

export async function signUpWithNeonPassword(
  email: string,
  password: string,
  emailRedirectTo: string,
) {
  const auth = requireNeonAuth()
  const signUpEmail =
    typeof auth.signUp === 'function'
      ? auth.signUp
      : auth.signUp.email
  const response = await signUpEmail({
    email,
    name: email.split('@')[0] || 'User',
    password,
    callbackURL: emailRedirectTo,
  }) as BetterAuthSessionResponse

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data?.session ?? response.data ?? null
}

export async function requestNeonPasswordReset(email: string, redirectTo: string) {
  const auth = requireNeonAuth()
  const response = auth.requestPasswordReset
    ? await auth.requestPasswordReset({
        email,
        redirectTo,
      })
    : await auth.resetPasswordForEmail!(email, {
        redirectTo,
      })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function resetNeonPassword(token: string, newPassword: string) {
  const auth = requireNeonAuth()
  const response = await auth.resetPassword({
    token,
    newPassword,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}
