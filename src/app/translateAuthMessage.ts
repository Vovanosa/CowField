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
