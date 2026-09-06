import { readStoredValue, removeStoredValue, writeStoredValue } from '../browserStorage'
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
 * Every access goes through `browserStorage`, so a browser with site data blocked reads as "nothing
 * remembered" rather than throwing out of whichever call site happened to run first.
 */
const GUEST_SESSION_TOKEN_STORAGE_KEY = 'cowfield.guest-session-token'
const SESSION_ROLE_STORAGE_KEY = 'cowfield.auth-session-role'

export function getStoredSessionToken() {
  return readStoredValue(GUEST_SESSION_TOKEN_STORAGE_KEY)
}

export function setStoredSessionToken(token: string) {
  writeStoredValue(GUEST_SESSION_TOKEN_STORAGE_KEY, token)
}

export function clearStoredSessionToken() {
  removeStoredValue(GUEST_SESSION_TOKEN_STORAGE_KEY)
  removeStoredValue(SESSION_ROLE_STORAGE_KEY)
}

export function getStoredSessionRole() {
  const role = readStoredValue(SESSION_ROLE_STORAGE_KEY)

  return role === 'admin' || role === 'user' || role === 'guest' ? role : null
}

export function setStoredSessionRole(role: AuthSession['role']) {
  writeStoredValue(SESSION_ROLE_STORAGE_KEY, role)
}

/**
 * Whether player data lives on this device rather than on the server.
 *
 * Asked **once per resource load**, not once per call site. It used to be four separate
 * `getStoredSessionRole() === 'guest'` branches inside `progressStorage`, one in front of each
 * function, so every caller re-decided which backend it was talking to.
 */
export function isGuestSession() {
  return getStoredSessionRole() === 'guest'
}
