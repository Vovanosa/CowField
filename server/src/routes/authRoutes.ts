import { Router } from 'express'

import { AuthController } from '../controllers/authController'
import { asyncHandler } from '../utils/asyncHandler'

export function createAuthRoutes(authController: AuthController) {
  const router = Router()

  router.post('/guest', asyncHandler(authController.loginAsGuest))
  router.get('/me', asyncHandler(authController.me))
  router.post('/logout', asyncHandler(authController.logout))

  return router
}
