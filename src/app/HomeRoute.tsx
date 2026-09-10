import { lazy } from 'react'

import { useAuth } from './useAuth'

/**
 * What `/` is depends on who is asking.
 *
 * A **visitor** gets the landing page: what the game is, and a one-tap guest start. A **player**
 * gets the home menu they have always had, unchanged.
 *
 * `/` rather than a separate `/welcome` (scope decision D2), because `/` is the URL that gets
 * shared, linked and indexed. A separate marketing path would split whatever authority the domain
 * earns and leave `/` itself redirecting to a login form.
 *
 * Both halves are lazy so a visitor downloads the landing page without the signed-in home page, and
 * neither pulls in the other.
 */
const HomePage = lazy(() =>
  import('../pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })),
)

export function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  /*
    Render nothing for the one tick session restore takes, the same as `RequireSession` does.

    This is safe for crawling, which was the worry: `getCurrentSession` short-circuits when there is
    no stored role, so a first-time visitor — and any crawler, which has no storage — resolves
    without a network call at all. The blank frame is not a state a bot can get stuck in.
  */
  if (isLoading) {
    return null
  }

  return isAuthenticated ? <HomePage /> : <LandingPage />
}
