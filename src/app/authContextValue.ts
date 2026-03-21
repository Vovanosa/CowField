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
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
