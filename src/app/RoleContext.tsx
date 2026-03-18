import { useMemo, useState, type PropsWithChildren } from 'react'
import { RoleContext, type AppRole } from './role'

const ROLE_STORAGE_KEY = 'cowfield.app-role'

function getInitialRole(): AppRole {
  if (typeof window === 'undefined') {
    return 'player'
  }

  const savedRole = window.localStorage.getItem(ROLE_STORAGE_KEY)

  return savedRole === 'admin' ? 'admin' : 'player'
}

export function RoleProvider({ children }: PropsWithChildren) {
  const [role, setRoleState] = useState<AppRole>(getInitialRole)

  function setRole(nextRole: AppRole) {
    setRoleState(nextRole)
    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole)
  }

  const value = useMemo(
    () => ({
      role,
      setRole,
      isAdmin: role === 'admin',
    }),
    [role],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}
