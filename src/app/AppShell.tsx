import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ProfileMenu } from '../components/ProfileMenu/ProfileMenu'
import { initializeAudio, syncAudioSettings } from '../game/audio/audioManager'
import { applyThemeMode } from '../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../game/usePlayerSettings'

export function AppShell() {
  const location = useLocation()
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
          {/*
            One control row for the whole shell. The profile menu used to be rendered only on `/`
            and positioned in the opposite corner, which left no way to log out — or even see who
            was signed in — from `/levels`, `/settings`, `/statistics`, `/about` or a game.

            It sits beside the language and theme pills because that corner is the one part of the
            frame every page already keeps clear (`PageHeader` has no actions slot for exactly that
            reason). The language pills still drop out on phones, where Settings duplicates them;
            the profile menu does not, because Settings is not a way to reach a logout that only
            exists in Settings.
          */}
          <div className="app-shell-controls">
            <ProfileMenu />
            <LanguageSwitcher />
          </div>
          <div key={location.pathname} className="route-stage">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
