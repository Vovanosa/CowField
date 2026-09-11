import { ApiError, NETWORK_ERROR_STATUS } from './ApiError'
import { clearBearerToken, getBearerToken } from './bearer'
import { getStoredSessionRole } from './sessionToken'

/**
 * The one place an HTTP request leaves the app.
 *
 * Every non-2xx becomes an {@link ApiError} carrying the **status**, so callers can branch on
 * `error.status === 404` instead of comparing the server's prose. Every transport failure becomes an
 * `ApiError` with `isNetworkFailure`, so "the server said no" and "we never reached the server" are
 * different things to everyone downstream.
 */

const DEFAULT_ERROR_MESSAGE = 'Request failed.'

function buildHeaders(init?: HeadersInit) {
  return {
    'Content-Type': 'application/json',
    ...(init ?? {}),
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    // A 500 from a proxy, an empty body, or HTML from a misrouted request. Not worth reporting as
    // its own failure — the status is the information.
    return undefined
  }
}

function readMessage(payload: unknown) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const { message } = payload as { message?: unknown }

    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }

  return DEFAULT_ERROR_MESSAGE
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(url, init)
  } catch (error) {
    throw new ApiError(NETWORK_ERROR_STATUS, DEFAULT_ERROR_MESSAGE, undefined, { cause: error })
  }

  if (!response.ok) {
    const payload = await readJsonBody(response)
    throw new ApiError(response.status, readMessage(payload), payload)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/**
 * `headers` is the **last** key on purpose. With `...init` after it, a caller passing its own
 * `headers` silently dropped every built one, including `Authorization`; it only ever worked
 * because each such caller happened to spell out `Content-Type` too.
 */
export async function buildAuthenticatedHeaders(init?: HeadersInit) {
  const token = await getBearerToken()

  return buildHeaders({
    ...(init ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })
}

export async function requestAuthenticatedJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await buildAuthenticatedHeaders(init?.headers)

  try {
    return await requestJson<T>(url, { ...init, headers })
  } catch (error) {
    // A cached token the server refuses is worse than no token: it would keep being sent until it
    // expired on its own. Dropping it here means the next call fetches a fresh one, so a session
    // that can recover, does.
    if (error instanceof ApiError && error.isUnauthorized) {
      clearBearerToken()
    }

    throw error
  }
}

/**
 * For an endpoint that answers **with or without a session** — the four level reads, since P18.
 *
 * The difference from `requestAuthenticatedJson` is what happens when nobody is signed in, and it
 * matters more than it looks. `getBearerToken` asks Neon for a JWT whenever there is no guest token
 * cached, and a `null` answer is **not** cached — so routing a signed-out visitor through it would
 * add a round trip to Neon in front of *every* level request, and a Neon outage would throw where a
 * public board should simply have loaded.
 *
 * The stored role is what makes that avoidable: it exists precisely so a signed-out visit makes no
 * requests it does not need (see `sessionToken.ts`). No role means no session, so there is nothing
 * to attach and nobody to ask.
 *
 * When there *is* a session this is `requestAuthenticatedJson` exactly — the bearer still goes, which
 * is what keeps an admin's `cowsByCell` coming and keeps their response out of a shared cache.
 */
export async function requestOptionallyAuthenticatedJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  if (!getStoredSessionRole()) {
    return requestJson<T>(url, { ...init, headers: buildHeaders(init?.headers) })
  }

  return requestAuthenticatedJson<T>(url, init)
}
