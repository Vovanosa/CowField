import { getNeonJwtToken } from './neonToken'
import { getStoredSessionToken } from './sessionToken'

/**
 * The bearer token for API calls, fetched **once per token lifetime** instead of once per request.
 *
 * This is the single biggest line in the measured baseline: `resolveBearerToken` used to call
 * Neon's `/token` before **every** API call, so a session that made 25 API calls made 25 Neon round
 * trips alongside them — half of all network traffic, for a value that is valid for a quarter of an
 * hour. Playing three levels cost 25 `/token` fetches; it costs 1.
 *
 * Two callers share one in-flight fetch, so a burst of parallel requests on page load cannot
 * stampede either.
 */

/**
 * Treat a token as expired this long before it actually is, so a request cannot be *issued* with a
 * valid token and *arrive* with an expired one.
 */
const EXPIRY_SKEW_MS = 30_000

/**
 * How long to trust a token whose `exp` could not be read. Short on purpose: the point is only to
 * collapse a burst, not to hold something we cannot reason about.
 */
const FALLBACK_TTL_MS = 60_000

type CachedToken = {
  token: string
  expiresAtMs: number
}

let cachedToken: CachedToken | null = null
let inFlightToken: Promise<string | null> | null = null

/**
 * Reads `exp` out of the JWT **without verifying it**.
 *
 * That is safe here and nowhere else: this decides a cache lifetime, not an identity. The token is
 * one Neon just handed us over an authenticated call, and the server verifies its signature
 * properly against Neon's JWKS on every request. A tampered `exp` could only shorten or lengthen a
 * client-side cache — the server would still reject the token itself.
 */
function readTokenExpiryMs(token: string): number | null {
  const segments = token.split('.')

  if (segments.length !== 3) {
    return null
  }

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { exp?: unknown }

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

async function fetchFreshToken() {
  const token = await getNeonJwtToken()

  if (!token) {
    cachedToken = null
    return null
  }

  const expiryMs = readTokenExpiryMs(token)

  cachedToken = {
    token,
    expiresAtMs: expiryMs === null ? Date.now() + FALLBACK_TTL_MS : expiryMs - EXPIRY_SKEW_MS,
  }

  return token
}

/**
 * The token to send, or `null` when there is genuinely nobody signed in.
 *
 * **Throws** an `ApiError` with `isNetworkFailure` when Neon could not be reached — deliberately
 * distinct from `null`. "We could not ask" is not "the answer is no", and conflating the two is
 * what used to sign a player out permanently after one offline page load.
 */
export async function getBearerToken(): Promise<string | null> {
  // Guests carry an opaque token our own backend minted, held in localStorage. There is no `exp` to
  // read and no network call to save — it is simply the credential.
  const guestToken = getStoredSessionToken()

  if (guestToken) {
    return guestToken
  }

  if (cachedToken && Date.now() < cachedToken.expiresAtMs) {
    return cachedToken.token
  }

  if (inFlightToken) {
    return inFlightToken
  }

  inFlightToken = fetchFreshToken().finally(() => {
    inFlightToken = null
  })

  return inFlightToken
}

/**
 * Drops the cached token.
 *
 * Call this whenever the identity behind it changes or is called into question: sign-in, sign-out,
 * and any `401` coming back from our own API — the last one is what stops a stale cached token
 * wedging a session until it expires on its own.
 */
export function clearBearerToken() {
  cachedToken = null
  inFlightToken = null
}

/** The cached token without fetching one. For tests and for callers that must not trigger a fetch. */
export function peekBearerToken() {
  return cachedToken && Date.now() < cachedToken.expiresAtMs ? cachedToken.token : null
}
