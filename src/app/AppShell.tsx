import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ProfileMenu } from '../components/ProfileMenu/ProfileMenu'
import { SiteFooter } from '../components/SiteFooter'
import { initializeAudio, syncAudioSettings } from '../game/audio/audioManager'
import { applyThemeMode } from '../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../game/usePlayerSettings'
import { useAuth } from './useAuth'

export function AppShell() {
  const location = useLocation()
  const settings = usePlayerSettings()
  const { session } = useAuth()
  const contentRef = useRef<HTMLElement | null>(null)
  const controlsRef = useRef<HTMLDivElement | null>(null)

  /*
    Publishes the control row's real width as `--app-controls-width`, which page headers turn into a
    right-hand gutter so a title can never run underneath it.

    **Measured rather than guessed, because the width is not knowable from CSS.** It changes with the
    display name, with the language (the pills read EN or UA), with whether anyone is signed in at
    all, and with the breakpoint that moves the pills into the profile dropdown. Every fixed value
    that covers the worst case wastes that much room in the common one.

    A `ResizeObserver` and not a resize listener: the row changes width when the *name* changes, not
    only when the window does — signing in, switching language, the pills collapsing. One observer on
    one element, writing one custom property, is cheaper than the layout it prevents.
  */
  useEffect(() => {
    const content = contentRef.current
    const controls = controlsRef.current

    if (!content || !controls) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
      content.style.setProperty('--app-controls-width', `${Math.ceil(width)}px`)
    })

    observer.observe(controls)

    return () => observer.disconnect()
  }, [])

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
        <main className="app-content" ref={contentRef}>
          {/*
            One control row for the whole shell. The profile menu used to be rendered only on `/`
            and positioned in the opposite corner, which left no way to log out — or even see who
            was signed in — from `/levels`, `/settings`, `/statistics`, `/about` or a game.

            It sits beside the language and theme pills because that corner is the one part of the
            frame every page already keeps clear (`PageHeader` has no actions slot for exactly that
            reason). The profile menu never drops out, because Settings is not a way to reach a
            logout that only exists in Settings.

            The pills do drop out, at 940px, and `data-has-profile` is what lets them — *only* when
            there is somewhere for them to go. A signed-out visitor has no dropdown, so for them the
            pills stay in the corner at every width, and with no profile pill beside them the row is
            narrow enough that they were never the thing crowding the title.
          */}
          <div
            className="app-shell-controls"
            data-has-profile={session ? 'true' : 'false'}
            ref={controlsRef}
          >
            <ProfileMenu />
            <LanguageSwitcher />
          </div>
          <div key={location.pathname} className="route-stage">
            <Outlet />
          </div>
          {/*
            Outside the keyed `route-stage` on purpose: keying it by pathname is what replays the
            page transition on every navigation, and the footer is the one thing that should not
            animate in again each time. It is also then rendered once rather than per route, which
            is the point — every public page reachable from every page.
          */}
          <SiteFooter />
        </main>
      </div>
    </div>
  )
}
