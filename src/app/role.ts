import { createContext, useContext } from 'react'

export type AppRole = 'player' | 'admin'

export type RoleContextValue = {
  role: AppRole
  setRole: (role: AppRole) => void
  isAdmin: boolean
}

export const RoleContext = createContext<RoleContextValue | null>(null)

export function useRole() {
  const context = useContext(RoleContext)

  if (!context) {
    throw new Error('useRole must be used within RoleProvider.')
  }

  return context
}
