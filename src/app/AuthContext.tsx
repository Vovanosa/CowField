import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  getCurrentSession,
  login as loginRequest,
  loginAsGuest as loginAsGuestRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../game/storage/authSessionStorage'
import { invalidateDifficultyLevelsPageCache } from '../game/storage/difficultyLevelsPageStorage'
import { invalidateDifficultyOverviewCache } from '../game/storage/difficultyOverviewStorage'
import { invalidatePlayerStatisticsCache } from '../game/storage/statisticsStorage'
import type { AuthSession } from '../game/types'
import { AuthContext, type AdminPreviewRole, type AuthContextValue } from './authContextValue'

const ADMIN_PREVIEW_ROLE_STORAGE_KEY = 'cowfield.admin-preview-role'

function getInitialPreviewRole(): AdminPreviewRole {
  if (typeof window === 'undefined') {
    return 'admin'
  }

  return window.localStorage.getItem(ADMIN_PREVIEW_ROLE_STORAGE_KEY) === 'user' ? 'user' : 'admin'
}

function resetCachedPlayerData() {
  invalidateDifficultyLevelsPageCache()
  invalidateDifficultyOverviewCache()
  invalidatePlayerStatisticsCache()
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [previewRole, setPreviewRoleState] = useState<AdminPreviewRole>(getInitialPreviewRole)

  useEffect(() => {
    let isActive = true

    async function loadSession() {
      const currentSession = await getCurrentSession()

      if (!isActive) {
        return
      }

      setSession(currentSession)
      setIsLoading(false)
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
      logout,
    }
  }, [isLoading, login, loginAsGuest, logout, previewRole, register, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
