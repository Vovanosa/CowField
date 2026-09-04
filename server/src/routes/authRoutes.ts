import { Router } from 'express'

import { AuthController } from '../controllers/authController'
import { createRateLimitMiddleware } from '../middleware/rateLimit'
import { asyncHandler } from '../utils/asyncHandler'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const ONE_HOUR_MS = 60 * 60 * 1000

export function createAuthRoutes(authController: AuthController) {
  const router = Router()

  // Every endpoint below proxies to Neon Auth, so an unthrottled one lets anybody guess passwords
  // through us — and burn our Neon quota doing it. Ten attempts per five minutes is far more than a
  // person needs and far less than a guessing run wants.
  const credentialLimit = createRateLimitMiddleware({
    windowMs: FIVE_MINUTES_MS,
    maxRequests: 10,
  })

  // Guest entry is separate because each call **inserts a session row that never expires**, so an
  // open loop here grows the sessions table without bound.
  // Twenty an hour still covers clearing browser storage and starting over repeatedly.
  const guestLimit = createRateLimitMiddleware({
    windowMs: ONE_HOUR_MS,
    maxRequests: 20,
  })

  router.post('/login', credentialLimit, asyncHandler(authController.login))
  router.post('/register', credentialLimit, asyncHandler(authController.register))
  router.post('/guest', guestLimit, asyncHandler(authController.loginAsGuest))
  router.post(
    '/request-password-reset',
    credentialLimit,
    asyncHandler(authController.requestPasswordReset),
  )
  router.post('/reset-password', credentialLimit, asyncHandler(authController.resetPassword))
  router.get('/me', asyncHandler(authController.me))
  router.post('/logout', asyncHandler(authController.logout))

  return router
}
