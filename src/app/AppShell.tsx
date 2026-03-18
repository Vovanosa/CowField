import { Outlet } from 'react-router-dom'

import { AppHeader } from '../components/AppHeader'

export function AppShell() {
  return (
    <div className="app-shell">
      <div className="app-frame">
        <AppHeader />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
