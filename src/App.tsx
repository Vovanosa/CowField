import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppShell } from './app/AppShell'
import { AboutPage } from './pages/AboutPage'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'
import { LevelsPage } from './pages/LevelsPage'
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
        path: 'game/:levelId',
        element: <GamePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
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
