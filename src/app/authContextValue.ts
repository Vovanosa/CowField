import { createContext } from 'react'

import type { AuthRole, AuthSession } from '../game/types'

export type AdminPreviewRole = 'admin' | 'user'

export type AuthContextValue = {
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  role: AuthRole | null
  effectiveRole: AuthRole | null
  isAdmin: boolean
  isGuest: boolean
  canPreviewUser: boolean
  previewRole: AdminPreviewRole
  setPreviewRole: (role: AdminPreviewRole) => void
  login: (email: string, password: string) => Promise<AuthSession>
  register: (email: string, password: string) => Promise<AuthSession>
  loginAsGuest: () => Promise<AuthSession>
  /**
   * Finishes an OAuth sign-in. Must go through the provider like every other entry point — calling
   * the storage function directly leaves this context with `session: null`, so the guards treat the
   * player as signed out and bounce them straight back to `/login`.
   */
  completeGoogleLogin: (code?: string) => Promise<AuthSession>
  /** Finishes the flow a verification email starts. Same reasoning as `completeGoogleLogin`. */
  completeEmailVerification: (code?: string) => Promise<AuthSession>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
