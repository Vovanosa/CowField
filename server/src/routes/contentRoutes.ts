import { Router } from 'express'

import { createRequireAuthMiddleware, requireAdmin } from '../middleware/authMiddleware'
import { ContentController } from '../controllers/contentController'
import { AuthService } from '../services/AuthService'
import { asyncHandler } from '../utils/asyncHandler'

export function createContentRoutes(contentController: ContentController, authService: AuthService) {
  const router = Router()
  const requireAuth = createRequireAuthMiddleware(authService)

  router.use(requireAuth)
  router.get('/:key', asyncHandler(contentController.getByKey))
  router.post('/:key', (request, _response, next) => {
    try {
      requireAdmin(request)
      next()
    } catch (error) {
      next(error)
    }
  }, asyncHandler(contentController.save))

  return router
}
