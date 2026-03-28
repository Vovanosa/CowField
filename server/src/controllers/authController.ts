import type { Request, Response } from 'express'

import { AuthService } from '../services/AuthService'
import { HttpError } from '../errors/HttpError'
import {
  loginInputSchema,
  registerInputSchema,
  requestPasswordResetInputSchema,
  resetPasswordInputSchema,
} from '../schemas/authSchemas'

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

  login = async (request: Request, response: Response) => {
    const input = loginInputSchema.parse(request.body)
    const session = await this.authService.loginWithNeonPassword(input)
    response.status(201).json(session)
  }

  register = async (request: Request, response: Response) => {
    const input = registerInputSchema.parse(request.body)
    const session = await this.authService.registerWithNeonPassword(input)
    response.status(201).json(session)
  }

  requestPasswordReset = async (request: Request, response: Response) => {
    const input = requestPasswordResetInputSchema.parse(request.body)
    await this.authService.requestNeonPasswordReset(input.email, input.frontendOrigin)
    response.status(202).json({
      sent: true,
    })
  }

  resetPassword = async (request: Request, response: Response) => {
    const input = resetPasswordInputSchema.parse(request.body)
    await this.authService.resetNeonPassword(input.token, input.password)
    response.json({
      reset: true,
    })
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

  mobileGoogleCallback = async (request: Request, response: Response) => {
    const requestedAppRedirect =
      typeof request.query.appRedirect === 'string' && request.query.appRedirect.length > 0
        ? request.query.appRedirect
        : 'cowfieldmobile://google-callback'
    const redirectUrl = new URL(requestedAppRedirect)

    for (const [key, value] of Object.entries(request.query)) {
      if (key === 'appRedirect') {
        continue
      }

      if (typeof value === 'string') {
        redirectUrl.searchParams.set(key, value)
      }
    }

    const escapedRedirectUrl = redirectUrl.toString().replace(/"/g, '&quot;')

    response
      .status(200)
      .type('html')
      .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to CowField Mobile</title>
  </head>
  <body style="font-family: sans-serif; padding: 24px; text-align: center;">
    <p>Redirecting back to the CowField Android app...</p>
    <p><a href="${escapedRedirectUrl}">Tap here if nothing happens.</a></p>
    <script>
      window.location.replace("${escapedRedirectUrl}");
    </script>
  </body>
</html>`)
  }
}
