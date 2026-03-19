import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { RoleSwitcher } from '../components/RoleSwitcher'
import { applyThemeMode, getPlayerSettings } from '../game/storage'
import { RoleProvider } from './RoleContext'

export function AppShell() {
  useEffect(() => {
    let isActive = true

    async function loadThemePreference() {
      const settings = await getPlayerSettings()

      if (!isActive) {
        return
      }

      applyThemeMode(settings.darkModeEnabled)
    }

    void loadThemePreference()

    return () => {
      isActive = false
    }
  }, [])

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
