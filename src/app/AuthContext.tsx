import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  completeEmailVerification as completeEmailVerificationRequest,
  completeGoogleLogin as completeGoogleLoginRequest,
  getCurrentSession,
  login as loginRequest,
  loginAsGuest as loginAsGuestRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../game/storage/authSessionStorage'
import { readStoredValue, writeStoredValue } from '../game/storage/browserStorage'
import { countGuestProgressEntries } from '../game/storage/guestProgressStorage'
import { importGuestProgressIntoAccount, resetPlayerCaches } from '../game/storage/resources'
import type { AuthSession } from '../game/types'
import { AuthContext, type AdminPreviewRole, type AuthContextValue } from './authContextValue'
import { reportUnexpectedError } from './reportUnexpectedError'

const ADMIN_PREVIEW_ROLE_STORAGE_KEY = 'cowfield.admin-preview-role'

function getInitialPreviewRole(): AdminPreviewRole {
  return readStoredValue(ADMIN_PREVIEW_ROLE_STORAGE_KEY) === 'user' ? 'user' : 'admin'
}

/**
 * Every cache that belongs to the player who is signing in or out.
 *
 * One call rather than a list to keep in step — the list lives in the storage layer, beside the
 * caches themselves. It used to be three explicit invalidations here, and adding a fourth cache
 * meant remembering to add it in two places.
 */
function resetCachedPlayerData() {
  resetPlayerCaches()
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [previewRole, setPreviewRoleState] = useState<AdminPreviewRole>(getInitialPreviewRole)

  /*
    The current session, readable from a callback without being a dependency of it.

    Every entry point below is `useCallback(..., [])` on purpose — they are handed to consumers
    through a memoised context value, and taking `session` as a dependency would rebuild all of them
    on every sign-in and re-render everything that holds one. `loginAsGuest` is the only one that
    needs to *read* the session, so it reads it here.
  */
  const currentSessionRef = useRef<AuthSession | null>(null)
  currentSessionRef.current = session

  useEffect(() => {
    let isActive = true

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession()

        if (!isActive) {
          return
        }

        setSession(currentSession)
      } catch (error) {
        // `getCurrentSession` swallows its own request failures, so reaching here means something
        // unexpected (blocked local storage, for instance). Treat it as signed out rather than
        // leaving `isLoading` true, which every route guard reads as "render nothing" — a blank app.
        reportUnexpectedError(error, 'session bootstrap')

        if (isActive) {
          setSession(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      isActive = false
    }
  }, [])

  function setPreviewRole(nextRole: AdminPreviewRole) {
    setPreviewRoleState(nextRole)
    // Purely a convenience across reloads; a browser that refuses to store it just starts on
    // 'admin' next time, which is the default anyway.
    writeStoredValue(ADMIN_PREVIEW_ROLE_STORAGE_KEY, nextRole)
  }

  const login = useCallback(async (email: string, password: string) => {
    resetCachedPlayerData()
    const nextSession = await loginRequest(email, password)
    setSession(nextSession)
    return nextSession
  }, [])

  /**
   * Creating an account, and — if this browser was a guest — bringing its progress along
   * (P18, decision D5).
   *
   * **Here rather than on the server**, because registration goes through Neon Auth in the browser:
   * there is no point in our own backend that sees "this person just became an account holder", and
   * the data being carried lives in `localStorage`, which only the client can read.
   *
   * **After the session swap, not before.** The import is authenticated as the *new* account, so it
   * cannot run until that account is the one holding the bearer.
   *
   * **A failed import must not fail the registration.** The account exists either way, and telling
   * someone their sign-up failed when it did not is worse than the missing times. `importGuestProgress`
   * leaves the local record untouched on failure, so nothing is lost and the data is still there.
   *
   * Only on **register**, never on `login` — signing in to an existing account leaves guest progress
   * alone and warns first. See the confirmation on the sign-in page.
   */
  const register = useCallback(async (email: string, password: string) => {
    const hadGuestProgress = countGuestProgressEntries() > 0
    resetCachedPlayerData()
    const nextSession = await registerRequest(email, password)
    setSession(nextSession)

    if (hadGuestProgress) {
      try {
        await importGuestProgressIntoAccount()
      } catch (error) {
        reportUnexpectedError(error, 'importing guest progress into a new account')
      }
    }

    return nextSession
  }, [])

  /**
   * **Already a guest? Keep that guest.**
   *
   * Every call used to mint a fresh guest token, so a guest who reached `/login` and pressed *Play
   * as guest* — the natural way back out of a sign-in page they opened by mistake — came back as a
   * different guest. Their times survived (guest progress is one `localStorage` key, not keyed to
   * the token), but the session, the bearer and every cache behind it were replaced for nothing.
   *
   * An expired guest token cannot reach this branch: `getCurrentSession` would have failed and left
   * `session` null, so a new one is minted exactly when there is nothing to keep.
   */
  const loginAsGuest = useCallback(async () => {
    if (currentSessionRef.current?.role === 'guest') {
      return currentSessionRef.current
    }

    resetCachedPlayerData()
    const nextSession = await loginAsGuestRequest()
    setSession(nextSession)
    return nextSession
  }, [])

  const completeGoogleLogin = useCallback(async (code?: string) => {
    resetCachedPlayerData()
    const nextSession = await completeGoogleLoginRequest(code)
    setSession(nextSession)
    return nextSession
  }, [])

  const completeEmailVerification = useCallback(async (code?: string) => {
    resetCachedPlayerData()
    const nextSession = await completeEmailVerificationRequest(code)
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(async () => {
    resetCachedPlayerData()
    await logoutRequest()
    setSession(null)
    setPreviewRole('admin')
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const role = session?.role ?? null
    const effectiveRole =
      session?.role === 'admin' ? previewRole : session?.role ?? null

    return {
      session,
      isLoading,
      isAuthenticated: session !== null,
      role,
      effectiveRole,
      isAdmin: effectiveRole === 'admin',
      isGuest: role === 'guest',
      canPreviewUser: role === 'admin',
      previewRole,
      setPreviewRole,
      login,
      register,
      loginAsGuest,
      completeGoogleLogin,
      completeEmailVerification,
      logout,
    }
  }, [
    completeEmailVerification,
    completeGoogleLogin,
    isLoading,
    login,
    loginAsGuest,
    logout,
    previewRole,
    register,
    session,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
