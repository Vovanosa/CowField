import { stripLanguagePrefix } from '../i18n'

/**
 * Where to send someone once they have signed in or signed up.
 *
 * New in P18. Before it, every auth page landed on `/` — fine when the only way to reach one was
 * from the home screen, and wrong now that a visitor can arrive on a level, hit the gate and choose
 * *Create account*. Losing the puzzle they came for at the moment they commit to an account is the
 * one place in the flow where a dropped intention costs the most.
 *
 * **The stored path is language-neutral** (`/game/easy/3`, never `/uk/game/easy/3`). The prefix is
 * added back by whichever language tree the auth page is mounted in, through `useNavigate` in
 * `navigation.tsx`, so the same link works in both and a reader cannot be moved between languages by
 * following their own sign-up.
 */

export const RETURN_TO_PARAM = 'returnTo'

/**
 * **Only a path on this site.**
 *
 * An unvalidated `returnTo` is an open redirect: `?returnTo=https://example.com` turns our own
 * sign-in page into a credible way to send someone somewhere else. Three rejections do the work —
 * anything not starting with `/`, anything starting with `//` (protocol-relative, which a browser
 * reads as another host), and anything with a backslash, which some parsers normalise to `/`.
 */
export function isSafeReturnPath(value: string | null | undefined): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\')
  )
}

/** The validated `returnTo` from a query string, or `null` when there is nothing usable. */
export function readReturnTo(search: string): string | null {
  const value = new URLSearchParams(search).get(RETURN_TO_PARAM)

  return isSafeReturnPath(value) ? value : null
}

/** Builds `/register?returnTo=…` from wherever the reader currently is. */
export function withReturnTo(authPath: string, currentPathname: string) {
  const neutralPath = stripLanguagePrefix(currentPathname)

  if (neutralPath === '/') {
    return authPath
  }

  return `${authPath}?${RETURN_TO_PARAM}=${encodeURIComponent(neutralPath)}`
}
