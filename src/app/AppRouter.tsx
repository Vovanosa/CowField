import { Suspense, lazy, useEffect, type ComponentType, type ReactNode } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppShell } from './AppShell'
import { HomeRoute } from './HomeRoute'
import { RouteErrorElement } from './RouteErrorElement'
import { useAuth } from './useAuth'
import { applyThemeMode } from '../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../game/usePlayerSettings'

function lazyPage<T extends ComponentType<object>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(load)
}

/*
  **Every** page is lazy now, not just the ones that felt heavy.

  Six of them — Home, About, Levels, DifficultyLevels, Settings, Statistics — used to be imported
  eagerly, so the entry chunk was 727 KB and a first-time visitor to the landing page downloaded the
  whole app, including pages they had no session to reach. Route-splitting is the only lever that
  matters for Core Web Vitals here, and the pages were already route-scoped; this is just moving them
  behind `import()`.
*/
const AboutPage = lazyPage(() =>
  import('../pages/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const CreateLevelPage = lazyPage(() =>
  import('../pages/CreateLevelPage').then((module) => ({ default: module.CreateLevelPage })),
)
const DifficultyLevelsPage = lazyPage(() =>
  import('../pages/DifficultyLevelsPage').then((module) => ({
    default: module.DifficultyLevelsPage,
  })),
)
const ForgotPasswordPage = lazyPage(() =>
  import('../pages/ForgotPasswordPage/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const GamePage = lazyPage(() =>
  import('../pages/GamePage').then((module) => ({ default: module.GamePage })),
)
const GoogleAuthCallbackPage = lazyPage(() =>
  import('../pages/GoogleAuthCallbackPage/GoogleAuthCallbackPage').then((module) => ({
    default: module.GoogleAuthCallbackPage,
  })),
)
const LevelsPage = lazyPage(() =>
  import('../pages/LevelsPage').then((module) => ({ default: module.LevelsPage })),
)
const LoginPage = lazyPage(() =>
  import('../pages/LoginPage/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const NotFoundPage = lazyPage(() =>
  import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const RegisterPage = lazyPage(() =>
  import('../pages/RegisterPage/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const ResetPasswordPage = lazyPage(() =>
  import('../pages/ResetPasswordPage/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
const SettingsPage = lazyPage(() =>
  import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const StatisticsPage = lazyPage(() =>
  import('../pages/StatisticsPage').then((module) => ({ default: module.StatisticsPage })),
)
const VerifyEmailPage = lazyPage(() =>
  import('../pages/VerifyEmailPage/VerifyEmailPage').then((module) => ({
    default: module.VerifyEmailPage,
  })),
)

function withSuspense(element: ReactNode) {
  return <Suspense fallback={null}>{element}</Suspense>
}

function RequireSession() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function RequireNonGuest() {
  const { isGuest } = useAuth()

  return isGuest ? <Navigate to="/" replace /> : <Outlet />
}

function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}

function PublicShell() {
  const settings = usePlayerSettings()

  useEffect(() => {
    applyThemeMode(settings.darkModeEnabled)
  }, [settings.darkModeEnabled])

  return (
    <div className="app-shell">
      <div className="app-frame">
        <main className="app-content">
          <div className="route-stage">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <PublicShell />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        path: '/auth/google/callback',
        element: withSuspense(<GoogleAuthCallbackPage />),
      },
      {
        path: '/reset-password',
        element: withSuspense(<ResetPasswordPage />),
      },
      {
        // Outside `PublicOnlyRoute` on purpose, like the OAuth callback: the page decides what an
        // already-signed-in visitor means, rather than being redirected before it can read the code.
        path: '/verify-email',
        element: withSuspense(<VerifyEmailPage />),
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            path: '/login',
            element: withSuspense(<LoginPage />),
          },
          {
            path: '/register',
            element: withSuspense(<RegisterPage />),
          },
          {
            path: '/forgot-password',
            element: withSuspense(<ForgotPasswordPage />),
          },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <AppShell />,
    // Catches a throw in the shell itself, where there is no outlet left to render into.
    errorElement: <RouteErrorElement />,
    children: [
      {
        // A pathless layout route, so a throw from a page renders inside the shell's
        // `<Outlet />` and leaves the header and navigation usable.
        errorElement: <RouteErrorElement />,
        children: [
          /*
            `RequireSession` used to wrap this entire subtree, which is why nothing on the site was
            indexable: measured 2026-09-10, `/`, `/about`, `/levels` and a nonsense path all
            rendered the same login form, 31 words, one `<title>`.

            It now guards only the routes that genuinely need a session. Two routes are public:
            `/` (the landing page for a visitor, today's home page for a player) and `/about`,
            which is the rules content and the best keyword page on the site. Everything else is
            unchanged — a signed-out visitor still gets bounced to `/login` from `/levels`,
            `/game`, `/settings` and `/statistics`.
          */
          {
            index: true,
            element: withSuspense(<HomeRoute />),
          },
          {
            // Public. Verified to need no session: no `useAuth`, no fetch, no storage.
            path: 'about',
            element: withSuspense(<AboutPage />),
          },
          {
            element: <RequireSession />,
            children: [
              {
                path: 'levels',
                element: withSuspense(<LevelsPage />),
              },
              {
                path: 'levels/:difficulty',
                element: withSuspense(<DifficultyLevelsPage />),
              },
              {
                path: 'levels/:difficulty/create',
                element: withSuspense(<CreateLevelPage />),
              },
              {
                path: 'levels/:difficulty/:levelNumber/edit',
                element: withSuspense(<CreateLevelPage />),
              },
              {
                path: 'game/:difficulty/:levelNumber',
                element: withSuspense(<GamePage />),
              },
              {
                element: <RequireNonGuest />,
                children: [
                  {
                    path: 'statistics',
                    element: withSuspense(<StatisticsPage />),
                  },
                ],
              },
              {
                path: 'settings',
                element: withSuspense(<SettingsPage />),
              },
            ],
          },
          {
            /*
              A real not-found view instead of `<Navigate to="/" replace />`. The redirect made
              every mistyped URL look like the home page, and `vercel.json` served all of them with
              a 200 — an unbounded supply of soft-404s. Unknown *top-level* paths now 404 at the
              edge; this catches the rest, such as `/levels/nonsense`, and reports `noindex`.
            */
            path: '*',
            element: withSuspense(<NotFoundPage />),
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
