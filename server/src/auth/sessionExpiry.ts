import type { SessionRole } from '../types/auth'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * How long a session row lives, by role. **Absolute, from creation — not sliding.**
 *
 * The two roles are deliberately different because the row means different things to each:
 *
 * - For `admin`/`user` the row is only a **cache**. The real credential is the Neon JWT the client
 *   sends, which carries its own `exp` and is verified against Neon's JWKS. Losing the row costs
 *   exactly one slower request — the JWKS path runs instead — so it can be short.
 * - For `guest` the row **is** the credential; our backend minted the token and nothing else can
 *   vouch for it. Expiring one signs that guest out of the API, so it is generous. Their progress
 *   is unaffected: it lives in `localStorage` under a fixed key, not against the session.
 *
 * Absolute rather than sliding on purpose. A sliding window would mean writing to the row on every
 * authenticated request, which is the exact per-request `UPDATE` that [plan.md](plan.md) P4 item 1
 * set out to remove.
 */
export const SESSION_TTL_MS: Record<SessionRole, number> = {
  admin: 7 * DAY_MS,
  user: 7 * DAY_MS,
  guest: 30 * DAY_MS,
}

/** The absolute moment a session created now should stop being accepted. */
export function getSessionExpiry(role: SessionRole, now: Date = new Date()) {
  return new Date(now.getTime() + SESSION_TTL_MS[role])
}
