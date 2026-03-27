import { Suspense, lazy, useEffect, type ComponentType, type ReactNode } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AuthProvider } from './app/AuthContext'
import { useAuth } from './app/useAuth'
import { AppShell } from './app/AppShell'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { StatusMessage } from './components/ui'
import { applyThemeMode } from './game/storage/playerSettingsStorage'
import { usePlayerSettings } from './game/usePlayerSettings'
import './App.css'

function lazyPage<T extends ComponentType<never>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(load as unknown as () => Promise<{ default: ComponentType<any> }>)
}

const AboutPage = lazyPage(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const CreateLevelPage = lazyPage(() =>
  import('./pages/CreateLevelPage').then((module) => ({ default: module.CreateLevelPage })),
)
const DifficultyLevelsPage = lazyPage(() =>
  import('./pages/DifficultyLevelsPage').then((module) => ({ default: module.DifficultyLevelsPage })),
)
const ForgotPasswordPage = lazyPage(() =>
  import('./pages/ForgotPasswordPage/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const GamePage = lazyPage(() => import('./pages/GamePage').then((module) => ({ default: module.GamePage })))
const GoogleAuthCallbackPage = lazyPage(() =>
  import('./pages/GoogleAuthCallbackPage/GoogleAuthCallbackPage').then((module) => ({
    default: module.GoogleAuthCallbackPage,
  })),
)
const HomePage = lazyPage(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const LevelsPage = lazyPage(() => import('./pages/LevelsPage').then((module) => ({ default: module.LevelsPage })))
const LoginPage = lazyPage(() =>
  import('./pages/LoginPage/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazyPage(() =>
  import('./pages/RegisterPage/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const ResetPasswordPage = lazyPage(() =>
  import('./pages/ResetPasswordPage/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
const SettingsPage = lazyPage(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const StatisticsPage = lazyPage(() =>
  import('./pages/StatisticsPage').then((module) => ({ default: module.StatisticsPage })),
)

function RouteFallback() {
  return (
    <div className="page-shell">
      <StatusMessage message="Loading..." compact />
    </div>
  )
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
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
          <LanguageSwitcher />
          <Outlet />
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
            element: withSuspense(<HomePage />),
          },
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
            path: 'about',
            element: withSuspense(<AboutPage />),
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

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
