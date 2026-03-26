import type { Request, Response } from 'express'

import { AuthService } from '../services/AuthService'
import { HttpError } from '../errors/HttpError'

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

    const session = await this.authService.getSessionByToken(token)

    if (!session) {
      throw new HttpError(401, 'Session not found.')
    }

    response.json(session)
  }

  logout = async (request: Request, response: Response) => {
    const token = getBearerToken(request)

    if (token) {
      await this.authService.logout(token)
    }

    response.status(204).send()
  }
}
