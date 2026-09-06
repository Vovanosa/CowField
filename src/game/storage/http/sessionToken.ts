import type { AuthSession } from '../../types'

/**
 * The two things the browser remembers about who is signed in.
 *
 * Split out of `authSessionStorage` so that `bearer.ts` can read them without importing the module
 * that imports *it* — `http/` is a leaf, and everything above it may depend on it.
 *
 * - **token** — only guests have one. It is an opaque credential our own backend minted and stored
 *   in the `sessions` table; the row *is* the session. `admin`/`user` have nothing here, because
 *   Neon owns their session and mints a fresh JWT on demand.
 * - **role** — remembered purely so a signed-out visit makes **no requests at all**. Without it,
 *   every visit by a signed-out player produced two guaranteed 401s.
 *
 * These reads are unguarded, exactly as they were before the move: a browser with site data blocked
 * throws here rather than returning null. That is **plan item 62**, which wants one guarded helper
 * across all six call sites (`i18n.ts` is the one that actually blanks the page, because it reads at
 * module top level before any error boundary exists). Guarding only this file would half-land it.
 */
const GUEST_SESSION_TOKEN_STORAGE_KEY = 'cowfield.guest-session-token'
const SESSION_ROLE_STORAGE_KEY = 'cowfield.auth-session-role'

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

export function setStoredSessionRole(role: AuthSession['role']) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SESSION_ROLE_STORAGE_KEY, role)
}
