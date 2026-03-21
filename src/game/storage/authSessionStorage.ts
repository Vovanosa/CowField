import type { AuthSession } from '../types'

const AUTH_API_BASE = '/api/auth'
const SESSION_TOKEN_STORAGE_KEY = 'cowfield.auth-session-token'

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

  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)
}

export function setStoredSessionToken(token: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
}

export function clearStoredSessionToken() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
}

export function buildAuthenticatedHeaders(init?: HeadersInit) {
  const token = getStoredSessionToken()

  return buildHeaders({
    ...(init ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })
}

export async function login(email: string, password: string) {
  const session = await requestJson<AuthSession>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  setStoredSessionToken(session.token)
  return session
}

export async function register(email: string, password: string) {
  const session = await requestJson<AuthSession>('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  setStoredSessionToken(session.token)
  return session
}

export async function loginAsGuest() {
  const session = await requestJson<AuthSession>('/guest', {
    method: 'POST',
  })

  setStoredSessionToken(session.token)
  return session
}

export async function getCurrentSession() {
  const token = getStoredSessionToken()

  if (!token) {
    return null
  }

  try {
    return await requestJson<AuthSession>('/me', {
      headers: buildAuthenticatedHeaders(),
    })
  } catch {
    clearStoredSessionToken()
    return null
  }
}

export async function logout() {
  try {
    await requestJson<void>('/logout', {
      method: 'POST',
      headers: buildAuthenticatedHeaders(),
    })
  } finally {
    clearStoredSessionToken()
  }
}

export async function requestPasswordReset(email: string) {
  return requestJson<PasswordResetRequestResponse>('/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token: string, password: string) {
  return requestJson<PasswordResetResponse>('/password-reset/reset', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
