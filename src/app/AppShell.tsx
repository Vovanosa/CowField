import { Outlet } from 'react-router-dom'

import { RoleSwitcher } from '../components/RoleSwitcher'
import { RoleProvider } from './RoleContext'

export function AppShell() {
  return (
    <RoleProvider>
      <div className="app-shell">
        <RoleSwitcher />
        <div className="app-frame">
          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
    </RoleProvider>
  )
}
