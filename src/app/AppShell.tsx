import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ProfileMenu } from '../components/ProfileMenu/ProfileMenu'
import { applyThemeMode } from '../game/storage'
import { usePlayerSettings } from '../game/usePlayerSettings'
import { useAuth } from './useAuth'

export function AppShell() {
  const location = useLocation()
  const { session } = useAuth()
  const settings = usePlayerSettings()

  useEffect(() => {
    applyThemeMode(settings.darkModeEnabled)
  }, [settings.darkModeEnabled])

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
