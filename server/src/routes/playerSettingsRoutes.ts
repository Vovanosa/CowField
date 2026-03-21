import { Router } from 'express'

import { createRequireAuthMiddleware } from '../middleware/authMiddleware'
import { PlayerSettingsController } from '../controllers/playerSettingsController'
import { AuthService } from '../services/AuthService'
import { asyncHandler } from '../utils/asyncHandler'

export function createPlayerSettingsRoutes(
  playerSettingsController: PlayerSettingsController,
  authService: AuthService,
) {
  const router = Router()
  const requireAuth = createRequireAuthMiddleware(authService)

  router.use(requireAuth)
  router.get('/', asyncHandler(playerSettingsController.getSettings))
  router.put('/', asyncHandler(playerSettingsController.saveSettings))

  return router
}
