import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../errors/HttpError'

type RateLimitOptions = {
  /** Length of the fixed window, in milliseconds. */
  windowMs: number
  /** Requests allowed per client per window. */
  maxRequests: number
}

type Bucket = {
  count: number
  resetAt: number
}

/**
 * Sweep expired buckets once the map is this big. There is no timer on purpose — an interval would
 * hold the event loop open and has to be torn down in tests and scripts. Pruning on the request
 * path costs nothing at these sizes and only runs when the map has actually grown.
 */
const PRUNE_AT_SIZE = 1000

/**
 * A fixed-window, in-memory rate limiter.
 *
 * Hand-written instead of `express-rate-limit`: this is thirty lines, and the project has one API
 * process with no shared store to coordinate through anyway. The trade-offs are worth stating —
 * counters live in this process's memory, so they reset on restart and are not shared if the API is
 * ever run as more than one instance. For slowing credential guessing on a single-instance API that
 * is enough; a distributed deployment would need Redis and a different implementation.
 *
 * Clients are keyed by `request.ip`, which behind a proxy is the **proxy's** address unless Express
 * is told to trust it — see `TRUST_PROXY` in `app.ts`. Without that, every caller shares one bucket.
 */
export function createRateLimitMiddleware({ windowMs, maxRequests }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>()

  return function rateLimit(request: Request, response: Response, next: NextFunction) {
    const now = Date.now()

    if (buckets.size >= PRUNE_AT_SIZE) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(key)
        }
      }
    }

    const clientKey = request.ip ?? 'unknown'
    const bucket = buckets.get(clientKey)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(clientKey, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    bucket.count += 1

    if (bucket.count > maxRequests) {
      response.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
      next(new HttpError(429, 'Too many requests. Try again in a moment.'))
      return
    }

    next()
  }
}
