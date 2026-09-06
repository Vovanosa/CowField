import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  completeGoogleLogin as completeGoogleLoginRequest,
  getCurrentSession,
  login as loginRequest,
  loginAsGuest as loginAsGuestRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../game/storage/authSessionStorage'
import { resetPlayerCaches } from '../game/storage/resources'
import type { AuthSession } from '../game/types'
import { AuthContext, type AdminPreviewRole, type AuthContextValue } from './authContextValue'
import { reportUnexpectedError } from './reportUnexpectedError'

const ADMIN_PREVIEW_ROLE_STORAGE_KEY = 'cowfield.admin-preview-role'

function getInitialPreviewRole(): AdminPreviewRole {
  if (typeof window === 'undefined') {
    return 'admin'
  }

  return window.localStorage.getItem(ADMIN_PREVIEW_ROLE_STORAGE_KEY) === 'user' ? 'user' : 'admin'
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

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_PREVIEW_ROLE_STORAGE_KEY, nextRole)
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    resetCachedPlayerData()
    const nextSession = await loginRequest(email, password)
    setSession(nextSession)
    return nextSession
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    resetCachedPlayerData()
    const nextSession = await registerRequest(email, password)
    setSession(nextSession)
    return nextSession
  }, [])

  const loginAsGuest = useCallback(async () => {
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
      logout,
    }
  }, [completeGoogleLogin, isLoading, login, loginAsGuest, logout, previewRole, register, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
