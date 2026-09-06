import { ApiError, NETWORK_ERROR_STATUS } from './ApiError'
import { getNeonAuthUrl } from './apiBase'

/**
 * Fetches a **JWT** for the current Neon session, for use as the bearer token against our API.
 *
 * This must not return the session object's `token`: that is an **opaque** Better Auth session
 * token, and our backend cannot verify it — Neon's `/account-info` rejects it and `/get-session`
 * ignores `Authorization` headers. `/token` mints a proper Ed25519-signed JWT instead, which the
 * backend verifies against Neon's published JWKS.
 *
 * `credentials: 'include'` is required — the Neon session lives in a cookie on the Neon domain.
 *
 * **`null` means there is no Neon session; a failure to ask throws.** It used to `catch { return
 * null }` around everything, so being offline was indistinguishable from being signed out — and the
 * caller's response to `null` was to erase the stored session, which is why one offline page load
 * signed a player out for good.
 *
 * It lives here, beside `bearer.ts`, rather than in `neonAuthClient.ts`, because it is **only a
 * `fetch`** — it needs the auth URL and nothing else. `neonAuthClient.ts` constructs the Neon SDK
 * client at module scope, which touches `document`; keeping that out of the bearer path leaves the
 * whole of `http/` importable outside a browser, which is what makes the request-count harness able
 * to run against the real modules.
 */
export async function getNeonJwtToken() {
  const neonAuthUrl = getNeonAuthUrl()

  if (!neonAuthUrl) {
    return null
  }

  let response: Response

  try {
    response = await fetch(`${neonAuthUrl}/token`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    throw new ApiError(NETWORK_ERROR_STATUS, 'Request failed.', undefined, { cause: error })
  }

  // The only answer that actually means "nobody is signed in here".
  if (response.status === 401 || response.status === 403) {
    return null
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'Request failed.')
  }

  const payload = (await response.json().catch(() => null)) as { token?: unknown } | null

  return typeof payload?.token === 'string' && payload.token.length > 0 ? payload.token : null
}
