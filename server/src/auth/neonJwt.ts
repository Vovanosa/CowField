import { createPublicKey, verify as verifySignature, type KeyObject } from 'node:crypto'

/**
 * Verifies the JWTs Neon Auth issues from its `/token` endpoint.
 *
 * This is the only way the API can identify a browser. Neon Auth is cookie-based and browser-first:
 * the session token it hands the client is **opaque**, `/account-info` rejects it (401, as a bearer
 * and as a cookie — Better Auth signs its cookies), and `/get-session` ignores `Authorization`
 * entirely, answering `200 null`. All probed directly. But Neon publishes a JWKS, so a JWT from
 * `/token` can be verified here cryptographically, with no per-request call to Neon.
 *
 * Deliberately dependency-free: Neon signs with **Ed25519 (EdDSA)**, which Node's built-in `crypto`
 * imports straight from a JWK and verifies natively.
 */

export type NeonJwtClaims = {
  sub: string
  email?: string
  name?: string
}

type Jwk = {
  kid?: string
  kty?: string
  crv?: string
  alg?: string
}

/** Cached JWKS. Refetched when a token arrives with an unseen `kid`, i.e. after a key rotation. */
let keyCache: Map<string, KeyObject> | null = null

/** When the JWKS was last *attempted*, whether or not it succeeded. See `getVerificationKey`. */
let lastJwksAttemptAt = 0

/** Don't refetch on every unknown kid — that would make bogus tokens a way to hammer Neon. */
const MIN_JWKS_REFETCH_INTERVAL_MS = 60_000

/**
 * Ceiling on the JWKS fetch.
 *
 * Without one this `fetch` inherits Node's default, which is effectively "until the socket dies".
 * Every authenticated request waits behind this call, so an unresponsive Neon would hang the API's
 * whole authenticated surface rather than failing it.
 */
const JWKS_FETCH_TIMEOUT_MS = 5_000

function decodeSegment(segment: string) {
  return Buffer.from(segment, 'base64url')
}

async function fetchJwks(neonAuthUrl: string) {
  const response = await fetch(`${neonAuthUrl}/.well-known/jwks.json`, {
    signal: AbortSignal.timeout(JWKS_FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Neon Auth JWKS request failed with status ${response.status}.`)
  }

  const body = (await response.json()) as { keys?: Jwk[] }
  const keys = new Map<string, KeyObject>()

  for (const jwk of body.keys ?? []) {
    if (!jwk.kid) {
      continue
    }

    try {
      keys.set(jwk.kid, createPublicKey({ key: jwk as never, format: 'jwk' }))
    } catch {
      // Skip key types this Node build cannot import rather than failing every login.
    }
  }

  return keys
}

async function getVerificationKey(neonAuthUrl: string, kid: string) {
  if (keyCache?.has(kid)) {
    return keyCache.get(kid) ?? null
  }

  // The interval covers **failed** attempts too, which is the point of tracking the attempt rather
  // than the last success. A failed fetch leaves `keyCache` null, and the old check only throttled
  // when a cache already existed — so while Neon's JWKS was unreachable, every single authenticated
  // request fired its own fetch at it, each now holding a socket for up to `JWKS_FETCH_TIMEOUT_MS`.
  if (Date.now() - lastJwksAttemptAt <= MIN_JWKS_REFETCH_INTERVAL_MS) {
    return keyCache?.get(kid) ?? null
  }

  lastJwksAttemptAt = Date.now()

  // Assigned only on success, so a transient failure keeps the keys we already had.
  keyCache = await fetchJwks(neonAuthUrl)

  return keyCache.get(kid) ?? null
}

/**
 * Whether the token's `aud` says it was minted for us.
 *
 * Neon Auth is Better Auth underneath, whose JWT plugin defaults `aud` to the auth base URL — the
 * same value it puts in `iss` — so the default rule here is "same host as the configured
 * `NEON_AUTH_URL`", matching how `iss` is treated below.
 *
 * `NEON_AUTH_AUDIENCE` overrides that with an exact string, and tightens the rule: with it set, a
 * token carrying no `aud` at all is rejected. Without it, an `aud` that is not URL-shaped is
 * accepted, because there would be nothing to compare it against — Neon can configure a custom
 * audience (a project id, say), and guessing wrong here would reject every real player's token.
 * Set the variable to close that.
 */
function isAudienceAccepted(audience: unknown, neonAuthUrl: string) {
  const audienceValues =
    typeof audience === 'string'
      ? [audience]
      : Array.isArray(audience)
        ? audience.filter((value): value is string => typeof value === 'string')
        : []

  const expectedAudience = process.env.NEON_AUTH_AUDIENCE?.trim()

  if (expectedAudience) {
    return audienceValues.includes(expectedAudience)
  }

  if (audienceValues.length === 0) {
    return true
  }

  let expectedHost: string

  try {
    expectedHost = new URL(neonAuthUrl).host
  } catch {
    return true
  }

  return audienceValues.some((value) => {
    try {
      return new URL(value).host === expectedHost
    } catch {
      // Not a URL, so this is a custom audience we have no expectation for.
      return true
    }
  })
}

/**
 * Returns the token's claims, or null if it is not a valid, unexpired, correctly signed Neon JWT.
 *
 * Every failure is a plain `null` — the caller turns that into a 401. Nothing is trusted before the
 * signature check: the payload is only parsed after the signature verifies.
 */
export async function verifyNeonJwt(
  token: string,
  neonAuthUrl: string | null,
): Promise<NeonJwtClaims | null> {
  if (!neonAuthUrl) {
    return null
  }

  const segments = token.split('.')

  if (segments.length !== 3) {
    return null
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments

  let kid: string | undefined

  try {
    const header = JSON.parse(decodeSegment(encodedHeader).toString('utf8')) as {
      kid?: unknown
      alg?: unknown
    }

    // Reject `alg: none` and anything that is not the EdDSA Neon actually signs with, so a token
    // cannot talk us out of checking its signature.
    if (header.alg !== 'EdDSA') {
      return null
    }

    kid = typeof header.kid === 'string' ? header.kid : undefined
  } catch {
    return null
  }

  if (!kid) {
    return null
  }

  let key: KeyObject | null

  try {
    key = await getVerificationKey(neonAuthUrl, kid)
  } catch {
    return null
  }

  if (!key) {
    return null
  }

  const signedData = Buffer.from(`${encodedHeader}.${encodedPayload}`)
  let isSignatureValid: boolean

  try {
    isSignatureValid = verifySignature(null, signedData, key, decodeSegment(encodedSignature))
  } catch {
    return null
  }

  if (!isSignatureValid) {
    return null
  }

  try {
    const payload = JSON.parse(decodeSegment(encodedPayload).toString('utf8')) as {
      sub?: unknown
      email?: unknown
      name?: unknown
      exp?: unknown
      iss?: unknown
      aud?: unknown
    }

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return null
    }

    // Expiry is mandatory: a signed token with no `exp` would never stop being accepted.
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
      return null
    }

    // The signature already proves the issuer, so `iss` is only checked when present.
    if (typeof payload.iss === 'string') {
      try {
        if (new URL(payload.iss).host !== new URL(neonAuthUrl).host) {
          return null
        }
      } catch {
        return null
      }
    }

    // A signed token still has to have been minted *for us*. Without this, any token Neon issued
    // for another audience was accepted here purely because it verified.
    if (!isAudienceAccepted(payload.aud, neonAuthUrl)) {
      return null
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    }
  } catch {
    return null
  }
}
