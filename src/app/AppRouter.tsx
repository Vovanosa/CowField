import { Suspense, lazy, useEffect, type ComponentType, type ReactNode } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'

import { AppShell } from './AppShell'
import { useAuth } from './useAuth'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { AboutPage } from '../pages/AboutPage'
import { DifficultyLevelsPage } from '../pages/DifficultyLevelsPage'
import { HomePage } from '../pages/HomePage'
import { LevelsPage } from '../pages/LevelsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { StatisticsPage } from '../pages/StatisticsPage'
import { applyThemeMode } from '../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../game/usePlayerSettings'

function lazyPage<T extends ComponentType<object>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(load)
}

const CreateLevelPage = lazyPage(() =>
  import('../pages/CreateLevelPage').then((module) => ({ default: module.CreateLevelPage })),
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
const MobileGoogleRelayPage = lazyPage(() =>
  import('../pages/MobileGoogleRelayPage/MobileGoogleRelayPage').then((module) => ({
    default: module.MobileGoogleRelayPage,
  })),
)
const MobileGoogleStartPage = lazyPage(() =>
  import('../pages/MobileGoogleStartPage/MobileGoogleStartPage').then((module) => ({
    default: module.MobileGoogleStartPage,
  })),
)
const LoginPage = lazyPage(() =>
  import('../pages/LoginPage/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazyPage(() =>
  import('../pages/RegisterPage/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const ResetPasswordPage = lazyPage(() =>
  import('../pages/ResetPasswordPage/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
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
  const location = useLocation()
  const settings = usePlayerSettings()
  const hideLanguageSwitcher =
    location.pathname === '/auth/mobile-google/start' ||
    location.pathname === '/auth/mobile-google/callback'

  useEffect(() => {
    applyThemeMode(settings.darkModeEnabled)
  }, [settings.darkModeEnabled])

  return (
    <div className="app-shell">
      <div className="app-frame">
        <main className="app-content">
          {hideLanguageSwitcher ? null : <LanguageSwitcher />}
          <div key={location.pathname} className="route-stage">
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
    children: [
      {
        path: '/auth/google/callback',
        element: withSuspense(<GoogleAuthCallbackPage />),
      },
      {
        path: '/auth/mobile-google/start',
        element: withSuspense(<MobileGoogleStartPage />),
      },
      {
        path: '/auth/mobile-google/callback',
        element: withSuspense(<MobileGoogleRelayPage />),
      },
      {
        path: '/reset-password',
        element: withSuspense(<ResetPasswordPage />),
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
    element: <RequireSession />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'levels',
            element: <LevelsPage />,
          },
          {
            path: 'levels/:difficulty',
            element: <DifficultyLevelsPage />,
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
            path: 'about',
            element: <AboutPage />,
          },
          {
            element: <RequireNonGuest />,
            children: [
              {
                path: 'statistics',
                element: <StatisticsPage />,
              },
            ],
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: '*',
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
