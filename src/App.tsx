import { useEffect } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AuthProvider } from './app/AuthContext'
import { useAuth } from './app/useAuth'
import { AppShell } from './app/AppShell'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { AboutPage } from './pages/AboutPage'
import { CreateLevelPage } from './pages/CreateLevelPage'
import { DifficultyLevelsPage } from './pages/DifficultyLevelsPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage'
import { GamePage } from './pages/GamePage'
import { GoogleAuthCallbackPage } from './pages/GoogleAuthCallbackPage/GoogleAuthCallbackPage'
import { HomePage } from './pages/HomePage'
import { LevelsPage } from './pages/LevelsPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { RegisterPage } from './pages/RegisterPage/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage/ResetPasswordPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { SettingsPage } from './pages/SettingsPage'
import { applyThemeMode } from './game/storage'
import { usePlayerSettings } from './game/usePlayerSettings'
import './App.css'

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
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <PublicShell />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: '/auth/google/callback',
            element: <GoogleAuthCallbackPage />,
          },
          {
            path: '/reset-password',
            element: <ResetPasswordPage />,
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
            element: <CreateLevelPage />,
          },
          {
            path: 'levels/:difficulty/:levelNumber/edit',
            element: <CreateLevelPage />,
          },
          {
            path: 'game/:difficulty/:levelNumber',
            element: <GamePage />,
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

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
