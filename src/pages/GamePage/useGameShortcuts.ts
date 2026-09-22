import { useEffect } from 'react'

import { hasOpenOverlay, isTypingTarget, runAfterEvent } from '../../app/keyboardTargets'

type UseGameShortcutsArgs = {
  /**
   * Whether a dialog of the page's own is open. Undo and restart behind a completion screen would
   * change a board the player can no longer see, and `hasOpenOverlay()` alone cannot tell the help
   * sheet — which `?` must still close — from every other dialog, which must block these.
   */
  isHelpOpen: boolean
  onUndo: () => void
  onRestart: () => void
  onLeave: () => void
}

/**
 * The shortcuts that belong to the whole game page rather than to a cell.
 *
 * **Why these are on the document and the board's are not.** Moving and marking only make sense
 * against a focused cell, and arrows inside a composite widget are the player's to use — taking
 * them globally would seize the page's scroll keys. Undo, restart and leave have no cell: they are
 * the page's, and a player who has tabbed to the Restart button still expects `Ctrl` + `Z` to work.
 *
 * `?` is not here — it belongs to the sheet it opens, and Settings offers that sheet too. See
 * `useShortcutSheetKey`.
 *
 * **`event.code`, not `event.key`, for the two letter-ish ones.** `Ctrl` + `Z` is muscle memory for
 * a *position* on the keyboard; on a Ukrainian layout that key reports `я`, and matching the
 * character would leave undo broken in the first language this site shipped.
 */
export function useGameShortcuts({
  isHelpOpen,
  onUndo,
  onRestart,
  onLeave,
}: UseGameShortcutsArgs) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return
      }

      // A dialog owns the keyboard while it is open: undo and restart behind a completion screen
      // would change a board the player can no longer see. The shortcut sheet is the one overlay
      // these may still fire behind, because it is a reference card, not a decision.
      const isBlockedByOverlay = hasOpenOverlay() && !isHelpOpen

      // Undo. `Meta` as well as `Ctrl` so it is the same key on a Mac.
      if (
        !isBlockedByOverlay &&
        event.code === 'KeyZ' &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        event.preventDefault()
        runAfterEvent(onUndo)
        return
      }

      // Restart: clears the board *and* the clock, and cannot be undone — `handleRestartBoard`
      // drops the move history. The three-key chord is the safeguard, which is why there is no
      // confirmation step to match the Restart button.
      if (
        !isBlockedByOverlay &&
        event.code === 'Backspace' &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault()
        runAfterEvent(onRestart)
        return
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      // No `isBlockedByOverlay` shortcut here: `Escape` inside a dialog is the dialog's, and it
      // closes itself. This must only fire when nothing is open — otherwise dismissing the
      // completion dialog would leave the board in the same keypress.
      if (event.key === 'Escape' && !hasOpenOverlay()) {
        event.preventDefault()
        runAfterEvent(onLeave)
      }
    }

    // Capture on `window` is the first point in the event's life — earlier than `document`, so
    // earlier than `Dialog`. That is what makes `hasOpenOverlay()` above a question with a stable
    // answer, rather than one whose answer depends on which handler has already run.
    window.addEventListener('keydown', handleKeyDown, true)

    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isHelpOpen, onUndo, onRestart, onLeave])
}
