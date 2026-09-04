import { Router } from 'express'

import {
  createRequireAuthMiddleware,
  createRequireNonGuestMiddleware,
} from '../middleware/authMiddleware'
import { PlayerStatisticsController } from '../controllers/playerStatisticsController'
import { AuthService } from '../services/AuthService'
import { asyncHandler } from '../utils/asyncHandler'

export function createPlayerStatisticsRoutes(
  playerStatisticsController: PlayerStatisticsController,
  authService: AuthService,
) {
  const router = Router()
  const requireAuth = createRequireAuthMiddleware(authService)

  router.use(requireAuth)
  router.use(createRequireNonGuestMiddleware())
  router.get('/', asyncHandler(playerStatisticsController.getSummary))
  router.post('/bull-placement', asyncHandler(playerStatisticsController.recordBullPlacements))

  return router
}
