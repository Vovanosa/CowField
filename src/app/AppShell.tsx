import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ProfileMenu } from '../components/ProfileMenu/ProfileMenu'
import { applyThemeMode, getPlayerSettings } from '../game/storage'
import { useAuth } from './useAuth'

export function AppShell() {
  const location = useLocation()
  const { session } = useAuth()

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
    <div className="app-shell">
      <div className="app-frame">
        <main className="app-content">
          {location.pathname === '/' && session ? <ProfileMenu /> : null}
          <LanguageSwitcher />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
