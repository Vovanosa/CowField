import { Router } from 'express'

import { createRequireAuthMiddleware } from '../middleware/authMiddleware'
import { PlayerProgressController } from '../controllers/playerProgressController'
import { AuthService } from '../services/AuthService'
import { asyncHandler } from '../utils/asyncHandler'

export function createPlayerProgressRoutes(
  playerProgressController: PlayerProgressController,
  authService: AuthService,
) {
  const router = Router()
  const requireAuth = createRequireAuthMiddleware(authService)

  router.use(requireAuth)
  router.get('/overview', asyncHandler(playerProgressController.getOverview))
  router.get('/:difficulty/summary', asyncHandler(playerProgressController.getDifficultySummary))
  router.get('/:difficulty', asyncHandler(playerProgressController.listByDifficulty))
  router.get('/:difficulty/:levelNumber', asyncHandler(playerProgressController.getByDifficultyAndNumber))
  router.post(
    '/:difficulty/:levelNumber/complete',
    asyncHandler(playerProgressController.completeLevel),
  )

  return router
}
