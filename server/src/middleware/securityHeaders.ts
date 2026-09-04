import type { NextFunction, Request, Response } from 'express'

/**
 * The response headers `helmet` would set, for the subset that means anything to a JSON API.
 *
 * Hand-written rather than pulling in the dependency — this is a handful of static headers, and the
 * project already prefers Node built-ins over a package for small jobs (see the JWKS verifier in
 * `AuthService`). Deliberately **not** set: `Cross-Origin-Resource-Policy`, which would do nothing
 * for CORS-enabled fetches but risks breaking them, and `Cross-Origin-Embedder-Policy`, which this
 * API has no use for.
 */
export function createSecurityHeadersMiddleware() {
  return function securityHeaders(_request: Request, response: Response, next: NextFunction) {
    // No response here is ever a document, so lock a browser out of doing anything with one if it
    // somehow renders it as such.
    response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    // Never let a browser guess a type other than the one we sent.
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('X-Frame-Options', 'DENY')
    // API paths can carry a level or difficulty; no reason to leak them to another origin.
    response.setHeader('Referrer-Policy', 'no-referrer')
    // Ignored over plain HTTP, so it is safe to send unconditionally and correct once deployed.
    response.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
    next()
  }
}
