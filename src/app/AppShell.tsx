import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { RoleSwitcher } from '../components/RoleSwitcher'
import { applyThemeMode, getPlayerSettings } from '../game/storage'
import i18n from '../i18n'
import { RoleProvider } from './RoleContext'

export function AppShell() {
  const location = useLocation()

  useEffect(() => {
    let isActive = true

    async function loadThemePreference() {
      const settings = await getPlayerSettings()

      if (!isActive) {
        return
      }

      applyThemeMode(settings.darkModeEnabled)
      void i18n.changeLanguage(settings.language)
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
            {location.pathname === '/' ? <LanguageSwitcher /> : null}
            <Outlet />
          </main>
        </div>
      </div>
    </RoleProvider>
  )
}
