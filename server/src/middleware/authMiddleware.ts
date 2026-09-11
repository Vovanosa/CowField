import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../errors/HttpError'
import { AuthService } from '../services/AuthService'
import type { SessionRole } from '../types/auth'

/**
 * The caller, as every controller sees them.
 *
 * No `token`: nothing server-side reads it back off the actor — the middleware already used it to
 * get here.
 */
export type AuthenticatedActor = {
  actorKey: string
  role: SessionRole
  email: string | null
  displayName: string
}

type RequestWithAuth = Request & {
  auth?: AuthenticatedActor
}

function getBearerToken(request: Request) {
  const authorizationHeader = request.header('authorization')

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null
  }

  return authorizationHeader.slice('Bearer '.length).trim()
}

export function createRequireAuthMiddleware(authService: AuthService) {
  return async function requireAuth(
    request: Request,
    _response: Response,
    next: NextFunction,
  ) {
    const token = getBearerToken(request)

    if (!token) {
      next(new HttpError(401, 'Authentication is required.'))
      return
    }

    const session = await authService.getSessionByToken(token)

    if (!session) {
      next(new HttpError(401, 'Session not found.'))
      return
    }

    ;(request as RequestWithAuth).auth = session
    next()
  }
}

/**
 * `requireAuth` for a route that works with or without a session.
 *
 * Added in P18 for the public level reads. A board is the thing a shared link points at, so it has
 * to answer an anonymous request — but the *same* route still has to recognise an admin, because an
 * admin's copy carries the authored solution and must not be cached like everyone else's.
 *
 * **A token that does not resolve is treated as no token, not as an error.** A stale bearer left in
 * a browser after a session expired would otherwise turn a public page into a 401, and the reader
 * has no way to act on that. Every route that actually needs a session still uses `requireAuth`,
 * which rejects exactly as before.
 */
export function createOptionalAuthMiddleware(authService: AuthService) {
  return async function optionalAuth(
    request: Request,
    _response: Response,
    next: NextFunction,
  ) {
    const token = getBearerToken(request)

    if (!token) {
      next()
      return
    }

    const session = await authService.getSessionByToken(token)

    if (session) {
      ;(request as RequestWithAuth).auth = session
    }

    next()
  }
}

export function getAuthenticatedActor(request: Request) {
  const actor = (request as RequestWithAuth).auth

  if (!actor) {
    throw new HttpError(401, 'Authentication is required.')
  }

  return actor
}

/**
 * The caller, or `null` when there is no session. Only for routes behind `optionalAuth` — anywhere
 * else `request.auth` is guaranteed and `getAuthenticatedActor` says so in its type.
 */
export function getOptionalActor(request: Request): AuthenticatedActor | null {
  return (request as RequestWithAuth).auth ?? null
}

export function requireAdmin(request: Request) {
  const actor = getAuthenticatedActor(request)

  if (actor.role !== 'admin') {
    throw new HttpError(403, 'Admin access is required.')
  }

  return actor
}

export function requireNonGuest(request: Request) {
  const actor = getAuthenticatedActor(request)

  if (actor.role === 'guest') {
    throw new HttpError(403, 'Guests cannot access this resource.')
  }

  return actor
}

/**
 * `requireNonGuest` as route middleware.
 *
 * Guests hold no backend rows at all, so any endpoint that writes player data is meaningless for
 * them — and worse than meaningless when the repository quietly no-ops and the route answers `201`
 * as though it saved something.
 */
export function createRequireNonGuestMiddleware() {
  return function requireNonGuestMiddleware(
    request: Request,
    _response: Response,
    next: NextFunction,
  ) {
    try {
      requireNonGuest(request)
      next()
    } catch (error) {
      next(error)
    }
  }
}
