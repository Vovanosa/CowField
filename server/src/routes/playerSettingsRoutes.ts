import { Router } from 'express'

import { PlayerSettingsController } from '../controllers/playerSettingsController'
import { asyncHandler } from '../utils/asyncHandler'

export function createPlayerSettingsRoutes(playerSettingsController: PlayerSettingsController) {
  const router = Router()

  router.get('/', asyncHandler(playerSettingsController.getSettings))
  router.put('/', asyncHandler(playerSettingsController.saveSettings))

  return router
}
