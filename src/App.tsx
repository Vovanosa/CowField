import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppShell } from './app/AppShell'
import { AboutPage } from './pages/AboutPage'
import { CreateLevelPage } from './pages/CreateLevelPage'
import { DifficultyLevelsPage } from './pages/DifficultyLevelsPage'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'
import { LevelsPage } from './pages/LevelsPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

const router = createBrowserRouter([
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
        path: 'statistics',
        element: <StatisticsPage />,
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
])

function App() {
  return <RouterProvider router={router} />
}

export default App
