import { Router } from 'express'

import {
  createRequireAuthMiddleware,
  createRequireNonGuestMiddleware,
} from '../middleware/authMiddleware'
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

  // The reads above stay open to guests and answer "nothing recorded", which is true — a guest has
  // no rows here. The write does not get the same treatment: the repository silently no-ops for an
  // actor with no user id, so this route used to answer `201 { progress, isNewBest }` for a
  // completion it never stored. Guest progress is client-local by design and must not round-trip.
  router.post(
    '/:difficulty/:levelNumber/complete',
    createRequireNonGuestMiddleware(),
    asyncHandler(playerProgressController.completeLevel),
  )

  return router
}
