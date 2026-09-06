import { Router } from 'express'

import { AuthController } from '../controllers/authController'
import { createRateLimitMiddleware } from '../middleware/rateLimit'
import { asyncHandler } from '../utils/asyncHandler'

const ONE_HOUR_MS = 60 * 60 * 1000

export function createAuthRoutes(authController: AuthController) {
  const router = Router()

  // Guest entry is the only unauthenticated write left here, and each call **inserts a session row**
  // that lives until its `expiresAt`, so an open loop grows the sessions table.
  // Twenty an hour still covers clearing browser storage and starting over repeatedly.
  //
  // There is no credential rate limit any more because there are no credential endpoints: `/login`,
  // `/register`, `/request-password-reset` and `/reset-password` were removed — the browser has
  // always talked to Neon Auth directly, and Neon does its own throttling. See `AuthService`.
  const guestLimit = createRateLimitMiddleware({
    windowMs: ONE_HOUR_MS,
    maxRequests: 20,
  })

  router.post('/guest', guestLimit, asyncHandler(authController.loginAsGuest))
  router.get('/me', asyncHandler(authController.me))
  router.post('/logout', asyncHandler(authController.logout))

  return router
}
