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
  router.get('/:difficulty', asyncHandler(playerProgressController.listByDifficulty))

  // The reads above stay open to guests and answer "nothing recorded", which is true — a guest has
  // no rows here. The write does not get the same treatment: the repository silently no-ops for an
  // actor with no user id, so this route used to answer `201 { progress, isNewBest }` for a
  // completion it never stored. Guest progress is client-local by design and must not round-trip.
  router.post(
    '/:difficulty/:levelNumber/complete',
    createRequireNonGuestMiddleware(),
    asyncHandler(playerProgressController.completeLevel),
  )

  /*
    The guest-to-account handover (P18, decision D5), and the **one** place guest progress reaches
    the backend. `requireNonGuest` for the same reason the completion route has it: the caller is by
    definition no longer a guest at this point — they just created an account — and a guest token
    here would write nowhere and answer 201 as though it had.

    No dedicated rate limit. It writes only to the calling account, it needs a real session to reach,
    and it runs at most once in an account's life; the global backstop in `app.ts` is the right
    ceiling for something with that blast radius.
  */
  router.post(
    '/import',
    createRequireNonGuestMiddleware(),
    asyncHandler(playerProgressController.importProgress),
  )

  return router
}
