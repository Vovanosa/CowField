import { useEffect } from 'react'

import { hasOpenOverlay, isTypingTarget, runAfterEvent } from '../../app/keyboardTargets'

type UseShortcutSheetKeyArgs = {
  /** Whether the sheet is the thing currently on screen. */
  isOpen: boolean
  onToggle: () => void
}

/**
 * `?` opens and closes the shortcut sheet, wherever the sheet is offered.
 *
 * Lives beside the dialog rather than inside the game page, because two screens offer it: a board,
 * where it is the point, and Settings, where the **Keyboard shortcuts** row is how someone finds the
 * feature at all — and a key that works on the row's dialog is how they find out the key exists.
 *
 * **Matched by character, not position.** `?` sits on a different physical key in almost every
 * layout, and what a player means by "press question mark" is the character — the opposite of
 * `WASD`, where the meaning *is* the position. That asymmetry is deliberate; see `arrowKeys.ts`.
 */
export function useShortcutSheetKey({ isOpen, onToggle }: UseShortcutSheetKeyArgs) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key !== '?' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return
      }

      // Another dialog owns the keyboard: `?` must not stack a help sheet on a completion screen.
      // The sheet itself is the exception, because this is also how it closes.
      if (hasOpenOverlay() && !isOpen) {
        return
      }

      event.preventDefault()
      runAfterEvent(onToggle)
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onToggle])
}
