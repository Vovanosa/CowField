import { Router } from 'express'

import { createRequireAuthMiddleware, requireAdmin } from '../middleware/authMiddleware'
import { LevelController } from '../controllers/levelController'
import { AuthService } from '../services/AuthService'
import { asyncHandler } from '../utils/asyncHandler'

export function createLevelRoutes(levelController: LevelController, authService: AuthService) {
  const router = Router()
  const requireAuth = createRequireAuthMiddleware(authService)

  router.use(requireAuth)
  router.get('/overview', asyncHandler(levelController.getOverview))
  router.get('/:difficulty/summary', asyncHandler(levelController.getDifficultySummary))
  router.get('/:difficulty', asyncHandler(levelController.listByDifficulty))
  router.get('/:difficulty/:levelNumber', asyncHandler(levelController.getByDifficultyAndNumber))
  router.post('/:difficulty/:levelNumber', (request, _response, next) => {
    try {
      requireAdmin(request)
      next()
    } catch (error) {
      next(error)
    }
  }, asyncHandler(levelController.save))
  router.delete('/:difficulty/:levelNumber', (request, _response, next) => {
    try {
      requireAdmin(request)
      next()
    } catch (error) {
      next(error)
    }
  }, asyncHandler(levelController.delete))

  return router
}
