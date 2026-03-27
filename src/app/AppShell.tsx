import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ProfileMenu } from '../components/ProfileMenu/ProfileMenu'
import { initializeAudio, syncAudioSettings } from '../game/audio/audioManager'
import { applyThemeMode } from '../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../game/usePlayerSettings'
import { useAuth } from './useAuth'

export function AppShell() {
  const location = useLocation()
  const { session } = useAuth()
  const settings = usePlayerSettings()

  useEffect(() => {
    initializeAudio()
  }, [])

  useEffect(() => {
    applyThemeMode(settings.darkModeEnabled)
  }, [settings.darkModeEnabled])

  useEffect(() => {
    syncAudioSettings(settings)
  }, [settings])

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
