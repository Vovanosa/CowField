import type { Request, Response } from 'express'

import {
  loginInputSchema,
  registerInputSchema,
  requestPasswordResetInputSchema,
  resetPasswordInputSchema,
} from '../schemas/authSchemas'
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

  register = async (request: Request, response: Response) => {
    const body = registerInputSchema.parse(request.body)
    const session = await this.authService.register(body)
    response.status(201).json(session)
  }

  login = async (request: Request, response: Response) => {
    const body = loginInputSchema.parse(request.body)
    const session = await this.authService.login(body)
    response.json(session)
  }

  loginAsGuest = async (_request: Request, response: Response) => {
    const session = await this.authService.createGuestSession()
    response.status(201).json(session)
  }

  googleLogin = async (_request: Request, response: Response) => {
    const authorizationUrl = this.authService.getGoogleAuthorizationUrl()
    response.redirect(302, authorizationUrl)
  }

  googleCallback = async (request: Request, response: Response) => {
    const fallbackCallbackUrl = new URL(this.authService.getGoogleFrontendCallbackUrl())

    try {
      const code = typeof request.query.code === 'string' ? request.query.code : null
      const state = typeof request.query.state === 'string' ? request.query.state : null
      const error = typeof request.query.error === 'string' ? request.query.error : null

      if (error) {
        throw new HttpError(401, 'Google login failed.')
      }

      if (!code || !state) {
        throw new HttpError(400, 'Google login response is invalid.')
      }

      const payload = await this.authService.loginWithGoogleCallback(code, state)
      const callbackUrl = new URL(payload.frontendCallbackUrl)
      callbackUrl.searchParams.set('token', payload.session.token)

      response.redirect(302, callbackUrl.toString())
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google login failed.'
      fallbackCallbackUrl.searchParams.set('error', message)
      response.redirect(302, fallbackCallbackUrl.toString())
    }
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

  requestPasswordReset = async (request: Request, response: Response) => {
    const body = requestPasswordResetInputSchema.parse(request.body)
    const payload = await this.authService.requestPasswordReset(body)
    response.status(202).json(payload)
  }

  resetPassword = async (request: Request, response: Response) => {
    const body = resetPasswordInputSchema.parse(request.body)
    const payload = await this.authService.resetPassword(body)
    response.json(payload)
  }
}
