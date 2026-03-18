import { Router } from 'express'

import { LevelController } from '../controllers/levelController'
import { asyncHandler } from '../utils/asyncHandler'

export function createLevelRoutes(levelController: LevelController) {
  const router = Router()

  router.get('/:difficulty/next-level-number', asyncHandler(levelController.getNextLevelNumber))
  router.get('/:difficulty', asyncHandler(levelController.listByDifficulty))
  router.get('/:difficulty/:levelNumber', asyncHandler(levelController.getByDifficultyAndNumber))
  router.post('/:difficulty/:levelNumber', asyncHandler(levelController.save))
  router.delete('/:difficulty/:levelNumber', asyncHandler(levelController.delete))

  return router
}
