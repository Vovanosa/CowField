export type AuthRole = 'admin' | 'user' | 'guest'

/**
 * Who is signed in.
 *
 * **No token.** For a Neon account the browser holds the JWT (cached in `storage/http/bearer.ts`);
 * for a guest it is in `localStorage`. `GET /api/auth/me` used to echo the caller's own bearer token
 * back — ~1.1 KB of JWT in a response body the browser was caching. And no `actorKey`: it addresses
 * the player in the server's repositories and was never read here.
 */
export type AuthSession = {
  role: AuthRole
  email: string | null
  displayName: string
}

/**
 * What `POST /api/auth/guest` answers with.
 *
 * The one response that legitimately carries a credential — a guest's token exists nowhere else, so
 * this is the only way the client can learn it.
 */
export type GuestSessionResponse = AuthSession & {
  token: string
}
