import { Router } from 'express'

import { AuthController } from '../controllers/authController'
import { asyncHandler } from '../utils/asyncHandler'

export function createAuthRoutes(authController: AuthController) {
  const router = Router()

  router.post('/login', asyncHandler(authController.login))
  router.post('/register', asyncHandler(authController.register))
  router.post('/guest', asyncHandler(authController.loginAsGuest))
  router.post('/request-password-reset', asyncHandler(authController.requestPasswordReset))
  router.post('/reset-password', asyncHandler(authController.resetPassword))
  router.get('/mobile-google/callback', asyncHandler(authController.mobileGoogleCallback))
  router.get('/me', asyncHandler(authController.me))
  router.post('/logout', asyncHandler(authController.logout))

  return router
}
