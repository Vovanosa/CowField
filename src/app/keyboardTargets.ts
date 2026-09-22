/**
 * Whether a key event is someone typing, rather than someone playing.
 *
 * Every page-level shortcut has to ask this first. The auth forms, the level editor's title field
 * and the share dialog's input are all places where `Backspace` means "delete a character" and
 * `Ctrl` + `Z` means "undo my typing" — and a game that grabs those is a game that eats text.
 *
 * `isContentEditable` covers the case no tag name will: a `<div>` the browser has made editable.
 */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tagName = target.tagName

  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}

/**
 * Whether something is open that owns the keyboard — a dialog or an open menu.
 *
 * Both already handle `Escape` themselves, on their own elements, and both let it bubble. Without
 * this a single `Escape` inside the completion dialog would close the dialog *and* run the page's
 * "go back", so finishing a level and dismissing the modal would also leave the board.
 */
export function hasOpenOverlay() {
  if (typeof document === 'undefined') {
    return false
  }

  return (
    document.querySelector('[role="dialog"], [role="alertdialog"]') !== null ||
    document.querySelector('[aria-expanded="true"]') !== null
  )
}

/**
 * Do it **after** the key event has finished propagating, never during it.
 *
 * Measured 2026-09-22, through three wrong versions:
 *
 * 1. From a bubble-phase listener, one `Escape` closed a dialog and instantly reopened it. `Dialog`
 *    closes itself from a `document` capture listener and React 19 flushes that discrete update
 *    synchronously, so a bubble listener found nothing open and acted as though nothing had been.
 * 2. A capture listener on `window` fixed that and broke the opposite case: opening a dialog mounted
 *    it *mid-dispatch*, and **a listener attached to a node the event has not reached yet still
 *    receives that event** — so the dialog's own `Escape` handler fired on the key that opened it.
 * 3. `queueMicrotask` did not help. **The microtask queue drains every time the JS stack empties,
 *    which includes the gap between two listeners on one event.**
 *
 * A task is the first point that is reliably after the whole dispatch. Decide synchronously — while
 * `hasOpenOverlay()` still has a stable answer — and change the screen from here.
 */
export function runAfterEvent(action: () => void) {
  window.setTimeout(action, 0)
}
