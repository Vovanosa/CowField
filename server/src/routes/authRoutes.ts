import { Router } from 'express'

import { AuthController } from '../controllers/authController'
import { asyncHandler } from '../utils/asyncHandler'

export function createAuthRoutes(authController: AuthController) {
  const router = Router()

  router.post('/register', asyncHandler(authController.register))
  router.post('/login', asyncHandler(authController.login))
  router.post('/guest', asyncHandler(authController.loginAsGuest))
  router.get('/google', asyncHandler(authController.googleLogin))
  router.get('/google/callback', asyncHandler(authController.googleCallback))
  router.get('/me', asyncHandler(authController.me))
  router.post('/logout', asyncHandler(authController.logout))
  router.post('/password-reset/request', asyncHandler(authController.requestPasswordReset))
  router.post('/password-reset/reset', asyncHandler(authController.resetPassword))

  return router
}
