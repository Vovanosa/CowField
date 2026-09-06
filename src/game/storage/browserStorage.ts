/**
 * The one guarded way this app touches `localStorage`.
 *
 * **Why a helper rather than a `try` at each call site.** `window.localStorage` does not merely
 * return null when a browser blocks site data — *accessing the property itself throws*
 * `SecurityError`. Safari with "Block All Cookies", Firefox with `dom.storage.enabled` off, and any
 * Chromium profile where the site is blocked all behave that way, and so does a first-party page
 * embedded in a third-party context.
 *
 * That made a storage-blocked browser unable to boot at all. `i18n.ts` reads the stored language at
 * **module top level**, which runs while `main.tsx` is still evaluating its imports — before the
 * error handlers are registered and before any React error boundary exists. The throw escaped
 * everything and the player got a blank page with nothing rendered and nothing reported.
 *
 * So every read answers `null` and every write answers `false` instead of throwing. A write's
 * boolean is not decoration: `playerSettingsStorage` reports it so the Settings page can say the
 * choice will not survive the tab, rather than claiming a save that never happened.
 *
 * This is a leaf — it imports nothing, which is what lets `i18n.ts` use it without dragging the
 * storage layer into the app's first module.
 */

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    // The property access is the part that throws; reading it into a local is the whole guard.
    return window.localStorage
  } catch {
    return null
  }
}

/** The stored string, or `null` for "absent" **and** for "this browser will not tell us". */
export function readStoredValue(key: string) {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

/** `true` only if the value is actually persisted — `false` on a blocked browser or a full quota. */
export function writeStoredValue(key: string, value: string) {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeStoredValue(key: string) {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}
