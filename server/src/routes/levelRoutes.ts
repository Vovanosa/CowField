import { Router } from 'express'

import {
  createOptionalAuthMiddleware,
  createRequireAuthMiddleware,
  requireAdmin,
} from '../middleware/authMiddleware'
import { createRateLimitMiddleware } from '../middleware/rateLimit'
import { LevelController } from '../controllers/levelController'
import { AuthService } from '../services/AuthService'
import { asyncHandler } from '../utils/asyncHandler'

const ONE_MINUTE_MS = 60_000

/**
 * Reading a level needs no session; changing one still needs an admin.
 *
 * **This file used to open with `router.use(requireAuth)`**, which is why a link to a puzzle was
 * worth nothing outside the app: the board behind it 401'd for anyone who was not signed in, so
 * every share and every crawl hit a login form. P18 splits the two halves apart — the four `GET`s
 * are public, and `POST`/`DELETE` keep the admin gate they always had (universal rule 6).
 *
 * **What makes the public reads safe is not this file.** `LevelService.getByDifficultyAndNumber`
 * builds its response field by field rather than by spreading the row, and attaches `cowsByCell`
 * only when the caller is an admin — so the authored solution cannot reach an anonymous request even
 * by accident. The three list-shaped reads select `levelNumber` and counts in SQL and never load a
 * board at all. Read that service before changing anything here.
 */
export function createLevelRoutes(levelController: LevelController, authService: AuthService) {
  const router = Router()
  const requireAuth = createRequireAuthMiddleware(authService)
  const optionalAuth = createOptionalAuthMiddleware(authService)

  /*
    A ceiling on the reads that no longer cost a session to make.

    The global backstop in `app.ts` is 600/minute across the whole API, which was sized for traffic
    that had to authenticate first. These four are now the only endpoints anyone can hit cold, so
    they get a limit of their own. 120/minute is roughly fifty times what playing generates — a
    player opens a board every couple of minutes, not twice a second — and it still lets a shared
    office address run several people at once.

    It sits *before* `optionalAuth` deliberately: a flood should be turned away before it costs a
    session lookup, which is a database query.
  */
  const publicReadLimit = createRateLimitMiddleware({
    windowMs: ONE_MINUTE_MS,
    maxRequests: 120,
  })

  function requireAdminMiddleware(
    request: Parameters<typeof requireAdmin>[0],
    _response: unknown,
    next: (error?: unknown) => void,
  ) {
    try {
      requireAdmin(request)
      next()
    } catch (error) {
      next(error)
    }
  }

  // ---------------------------------------------------------------- public reads
  //
  // `optionalAuth` rather than nothing: the board read still has to recognise an admin, and every
  // one of these varies its `Cache-Control` on whether a session is present.

  router.get('/overview', publicReadLimit, optionalAuth, asyncHandler(levelController.getOverview))
  router.get(
    '/:difficulty/summary',
    publicReadLimit,
    optionalAuth,
    asyncHandler(levelController.getDifficultySummary),
  )
  router.get(
    '/:difficulty',
    publicReadLimit,
    optionalAuth,
    asyncHandler(levelController.listByDifficulty),
  )
  router.get(
    '/:difficulty/:levelNumber',
    publicReadLimit,
    optionalAuth,
    asyncHandler(levelController.getByDifficultyAndNumber),
  )

  // ----------------------------------------------------------------- admin writes
  //
  // `requireAuth` explicitly, since there is no blanket guard above them any more. Dropping it here
  // would leave `requireAdmin` reading an actor that was never attached, which throws 401 rather
  // than letting anything through — but relying on that would be relying on an accident.

  router.post(
    '/:difficulty/:levelNumber',
    requireAuth,
    requireAdminMiddleware,
    asyncHandler(levelController.save),
  )
  router.delete(
    '/:difficulty/:levelNumber',
    requireAuth,
    requireAdminMiddleware,
    asyncHandler(levelController.delete),
  )

  return router
}
