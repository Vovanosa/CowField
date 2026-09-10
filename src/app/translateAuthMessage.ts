import type { TFunction } from 'i18next'

/**
 * Translate an auth message that came from **our own code** — a thrown `Error` from the Neon client
 * or a message our API put in a response body.
 *
 * The English text is the key (see `locales/en.ts`), and i18next returns the key itself when there
 * is no entry, which is what makes an unrecognised server message still readable rather than blank.
 * That fallback is safe here because the source is trusted.
 *
 * **Do not use this on anything from the URL.** Use `translateKnownAuthMessage` for that.
 */
export function translateAuthMessage(t: TFunction, message: string) {
  return t(message)
}

/**
 * Translate a message only if it is one we actually ship a string for; `null` for anything else.
 *
 * This exists for `?error=` in the address bar. i18next echoing an unknown key back meant
 * `/login?error=Your%20account%20was%20suspended,%20call%20+1…` rendered that sentence as the app's
 * own error message, in the app's own error styling, on the page that also asks for a password.
 * React escapes it so it was never XSS — it was a free phishing surface, and the caller could not
 * tell "a message we wrote" from "a message a link handed us".
 *
 * `defaultValue: ''` is the whole trick: it replaces the echo-the-key fallback with an empty string,
 * so an empty result *means* "not one of ours".
 */
export function translateKnownAuthMessage(t: TFunction, message: string) {
  if (!message) {
    return null
  }

  const translated = t(message, { defaultValue: '' })

  return translated === '' ? null : translated
}

/**
 * Turn a **caught** auth failure into something safe to render.
 *
 * `translateAuthMessage` echoes an unrecognised message back, which is right for text our own code
 * wrote and wrong for anything that merely *arrived* as an `Error`. Two things do:
 *
 *  - **the provider's own server prose**, which is untranslated and sometimes internal;
 *  - **a JavaScript `TypeError`**, which after minification reads like `n is not a function` — and
 *    that is not a hypothetical: the reset-password page rendered exactly that string, in the app's
 *    error styling, under two password fields, until the call behind it was fixed on 2026-09-10.
 *
 * So a caught message is allowlisted, the same way `?error=` is, and anything unrecognised becomes
 * the caller's fallback. The real error still goes to the console, which is where an internal
 * message is useful and harmless — the point is that the player is never the one reading it.
 */
export function translateAuthError(t: TFunction, error: unknown, fallback: string) {
  // Not `console.error` on a handled failure a player caused (a wrong password is not a fault), but
  // the underlying text has to survive somewhere or an unmapped provider message becomes invisible
  // to whoever has to map it.
  console.warn('Auth request failed:', error)

  if (!(error instanceof Error)) {
    return fallback
  }

  return translateKnownAuthMessage(t, error.message) ?? fallback
}
