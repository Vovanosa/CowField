/**
 * The one place an unexpected error gets recorded.
 *
 * There is no error-reporting service wired up, so this is `console.error` — but routing every
 * boundary and global handler through a single function means adding one later is one edit here
 * rather than a hunt through the app.
 */
export function reportUnexpectedError(error: unknown, context?: string) {
  console.error(`[cowfield] unexpected error${context ? ` (${context})` : ''}`, error)
}

let hasRegisteredGlobalHandlers = false

/**
 * Catches the two failures React boundaries cannot see: a rejected promise nobody awaited, and an
 * error thrown outside of rendering (an event handler, a timer, a module's top level).
 *
 * Neither of those was recorded anywhere before — they simply vanished, which is why a broken
 * request could leave a page loading with no trace of what went wrong.
 */
export function registerGlobalErrorHandlers() {
  if (typeof window === 'undefined' || hasRegisteredGlobalHandlers) {
    return
  }

  hasRegisteredGlobalHandlers = true

  window.addEventListener('unhandledrejection', (event) => {
    reportUnexpectedError(event.reason, 'unhandled rejection')
  })

  window.addEventListener('error', (event) => {
    reportUnexpectedError(event.error ?? event.message, 'uncaught error')
  })
}
