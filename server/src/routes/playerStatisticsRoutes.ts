import { Router } from 'express'

import { PlayerStatisticsController } from '../controllers/playerStatisticsController'
import { asyncHandler } from '../utils/asyncHandler'

export function createPlayerStatisticsRoutes(playerStatisticsController: PlayerStatisticsController) {
  const router = Router()

  router.get('/', asyncHandler(playerStatisticsController.getSummary))
  router.post('/bull-placement', asyncHandler(playerStatisticsController.recordBullPlacement))

  return router
}
