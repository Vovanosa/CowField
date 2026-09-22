import { useEffect } from 'react'

import { hasOpenOverlay, isTypingTarget, runAfterEvent } from './keyboardTargets'

/** The page's own back control, which every screen with a `PageHeader` already renders. */
const PAGE_BACK_SELECTOR = '[data-page-back]'

/**
 * `Esc` goes back a step, on every screen that has a back control.
 *
 * **The page decides where back goes; `Esc` only presses the button.** Every screen with a
 * `PageHeader` already renders one — level list → difficulties, a difficulty → the level list,
 * Settings → home — and reusing it means this hook holds no map of the site that could fall out of
 * date, and `Esc` can never disagree with the arrow the player can see.
 *
 * Clicking the link rather than calling `navigate` keeps the language prefix right: the `href` was
 * built by `app/navigation`, so it already carries `/uk` or `/es`.
 *
 * **Not on a board.** A game page owns `Esc` itself, because leaving a half-solved puzzle has to ask
 * first — see `useGameShortcuts`.
 */
export function useEscapeBack(isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || isTypingTarget(event.target)) {
        return
      }

      // A dialog or an open menu owns `Escape` while it is up, and closes itself with it. Acting
      // here as well would close the menu *and* leave the page in one keypress.
      if (hasOpenOverlay()) {
        return
      }

      const back = document.querySelector<HTMLElement>(PAGE_BACK_SELECTOR)

      if (!back) {
        return
      }

      event.preventDefault()
      runAfterEvent(() => back.click())
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isEnabled])
}
