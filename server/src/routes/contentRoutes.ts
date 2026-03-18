import { Router } from 'express'

import { ContentController } from '../controllers/contentController'
import { asyncHandler } from '../utils/asyncHandler'

export function createContentRoutes(contentController: ContentController) {
  const router = Router()

  router.get('/:key', asyncHandler(contentController.getByKey))
  router.post('/:key', asyncHandler(contentController.save))

  return router
}
