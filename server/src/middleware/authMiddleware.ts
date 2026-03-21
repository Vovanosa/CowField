import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../errors/HttpError'
import { AuthService } from '../services/AuthService'
import type { SessionRole } from '../types/auth'

export type AuthenticatedActor = {
  token: string
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

export function getAuthenticatedActor(request: Request) {
  const actor = (request as RequestWithAuth).auth

  if (!actor) {
    throw new HttpError(401, 'Authentication is required.')
  }

  return actor
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
