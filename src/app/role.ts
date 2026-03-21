import { useAuth } from './useAuth'

export type AppRole = 'admin' | 'user' | 'guest'

export type RoleContextValue = {
  role: AppRole
  setRole: (role: 'admin' | 'user') => void
  isAdmin: boolean
  isGuest: boolean
}

export function useRole() {
  const auth = useAuth()

  return {
    role: auth.effectiveRole ?? 'guest',
    setRole: auth.setPreviewRole,
    isAdmin: auth.isAdmin,
    isGuest: auth.isGuest,
  }
}
