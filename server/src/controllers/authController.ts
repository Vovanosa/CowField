import type { Request, Response } from 'express'

import { AuthService } from '../services/AuthService'
import { HttpError } from '../errors/HttpError'
import type { AuthIdentity } from '../types/auth'

function getBearerToken(request: Request) {
  const authorizationHeader = request.header('authorization')

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null
  }

  return authorizationHeader.slice('Bearer '.length).trim()
}

export class AuthController {
  private readonly authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  loginAsGuest = async (_request: Request, response: Response) => {
    const session = await this.authService.createGuestSession()
    response.status(201).json(session)
  }

  me = async (request: Request, response: Response) => {
    const token = getBearerToken(request)

    if (!token) {
      throw new HttpError(401, 'Authentication is required.')
    }

    const actor = await this.authService.getSessionByToken(token)

    if (!actor) {
      throw new HttpError(401, 'Session not found.')
    }

    // Never cached, and never revalidated. This says who the bearer of *this* token is; a stored
    // copy is either useless or wrong, and the response used to be worth 1.5 KB because it echoed
    // the caller's own JWT straight back into a body the browser was caching.
    response.setHeader('Cache-Control', 'no-store')

    // `actorKey` stays server-side. It addresses the player in every repository call, and nothing on
    // the client has ever read it.
    response.json({
      role: actor.role,
      email: actor.email,
      displayName: actor.displayName,
    } satisfies AuthIdentity)
  }

  logout = async (request: Request, response: Response) => {
    const token = getBearerToken(request)

    if (token) {
      await this.authService.logout(token)
    }

    response.status(204).send()
  }
}
