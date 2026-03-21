export type AuthRole = 'admin' | 'user' | 'guest'

export type AuthSession = {
  token: string
  actorKey: string
  role: AuthRole
  email: string | null
  displayName: string
}
