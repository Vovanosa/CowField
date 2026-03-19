import { Router } from 'express'

import { PlayerProgressController } from '../controllers/playerProgressController'
import { asyncHandler } from '../utils/asyncHandler'

export function createPlayerProgressRoutes(playerProgressController: PlayerProgressController) {
  const router = Router()

  router.get('/:difficulty', asyncHandler(playerProgressController.listByDifficulty))
  router.get('/:difficulty/:levelNumber', asyncHandler(playerProgressController.getByDifficultyAndNumber))
  router.post(
    '/:difficulty/:levelNumber/complete',
    asyncHandler(playerProgressController.completeLevel),
  )

  return router
}
