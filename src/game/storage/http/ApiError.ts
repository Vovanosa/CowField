/**
 * The one error type the API layer throws.
 *
 * Before this, `request.ts` threw a bare `Error(message)` and **discarded the HTTP status**, so
 * nothing downstream could tell a 401 from a 429 from a 500. Callers compensated by matching on the
 * message text — `levelStorage` compared against the literal `'Level not found.'` to detect a 404 —
 * which meant the server's free-text copy was load-bearing: rewording a message silently changed
 * client behaviour.
 */
export class ApiError extends Error {
  /**
   * The HTTP status, or {@link NETWORK_ERROR_STATUS} (`0`) when the request never reached the
   * server at all.
   */
  readonly status: number

  /** The parsed response body, when there was one. `undefined` for a transport failure. */
  readonly payload: unknown

  constructor(status: number, message: string, payload?: unknown, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }

  /**
   * The request never completed — offline, DNS failure, the server unreachable, the request
   * aborted. **Distinct from every server answer**, which is the whole point: "we could not ask"
   * must not be treated as "the answer was no". That conflation is what signed a player out
   * permanently after a single offline page load.
   */
  get isNetworkFailure() {
    return this.status === NETWORK_ERROR_STATUS
  }

  /** The credential was refused. The caller may safely discard it. */
  get isUnauthorized() {
    return this.status === 401 || this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }
}

/** `status` for a request that never reached the server. Not a real HTTP status; nothing returns 0. */
export const NETWORK_ERROR_STATUS = 0

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
