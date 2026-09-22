import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import { isPlainArrowInput, toArrowDirection } from './arrowKeys'

type ListArrowNavigationOptions = {
  /** Matches the focusable items inside the container, in the order they should be walked. */
  selector: string
  /** Whether the ends join up. A menu wraps; a row of difficulty chips does not. */
  wrap?: boolean
}

/**
 * Arrow keys through a one-dimensional list of links or buttons.
 *
 * **Both axes move by one.** These lists are a line of things whichever way they happen to be laid
 * out — the five difficulty chips stack on a phone and sit in a row on a desktop, and a menu is
 * vertical but sits under a horizontal control. Asking a player to remember which axis a particular
 * list uses is asking them to remember the CSS.
 *
 * Returns whether it moved focus, so a caller can decide what else the key should do.
 */
export function handleListArrowNavigation(
  event: ReactKeyboardEvent<HTMLElement>,
  { selector, wrap = false }: ListArrowNavigationOptions,
) {
  if (!isPlainArrowInput(event)) {
    return false
  }

  const direction = toArrowDirection(event.key, event.code)

  if (!direction) {
    return false
  }

  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(selector))
  const currentIndex = items.indexOf(document.activeElement as HTMLElement)

  if (currentIndex < 0) {
    return false
  }

  const step = direction === 'left' || direction === 'up' ? -1 : 1
  const rawIndex = currentIndex + step
  const nextIndex = wrap ? (rawIndex + items.length) % items.length : rawIndex

  if (nextIndex < 0 || nextIndex >= items.length) {
    // Still ours: the arrow means "move within this list", and at the end of the list that means
    // stay put. Letting it through would scroll the page instead, which reads as the list moving.
    event.preventDefault()
    return false
  }

  event.preventDefault()
  items[nextIndex].focus()

  return true
}
