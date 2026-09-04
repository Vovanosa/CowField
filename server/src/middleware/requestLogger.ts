import type { NextFunction, Request, Response } from 'express'

/**
 * One line per request, written when the response finishes.
 *
 * The path is captured **up front and from `originalUrl`**, not read inside the `finish` callback:
 * Express rewrites `request.url` when it hands off to a mounted router, so `request.path` read at
 * finish time reports the router-relative path — `/overview` instead of `/api/progress/overview`.
 *
 * The query string is stripped rather than logged. It is the one part of a request that can carry a
 * credential (a password-reset link), and it has no business in a log. Bodies and headers are never
 * touched, for the same reason.
 */
export function createRequestLoggerMiddleware() {
  return function requestLogger(request: Request, response: Response, next: NextFunction) {
    const startedAt = process.hrtime.bigint()
    const path = request.originalUrl.split('?')[0]
    const method = request.method

    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
      console.log(`${method} ${path} ${response.statusCode} ${durationMs.toFixed(1)}ms`)
    })

    next()
  }
}
