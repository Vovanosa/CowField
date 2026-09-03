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
let keyCacheFetchedAt = 0

/** Don't refetch on every unknown kid — that would make bogus tokens a way to hammer Neon. */
const MIN_JWKS_REFETCH_INTERVAL_MS = 60_000

function decodeSegment(segment: string) {
  return Buffer.from(segment, 'base64url')
}

async function fetchJwks(neonAuthUrl: string) {
  const response = await fetch(`${neonAuthUrl}/.well-known/jwks.json`)

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

  const isStale = Date.now() - keyCacheFetchedAt > MIN_JWKS_REFETCH_INTERVAL_MS

  if (keyCache && !isStale) {
    return null
  }

  keyCache = await fetchJwks(neonAuthUrl)
  keyCacheFetchedAt = Date.now()

  return keyCache.get(kid) ?? null
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

    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    }
  } catch {
    return null
  }
}
