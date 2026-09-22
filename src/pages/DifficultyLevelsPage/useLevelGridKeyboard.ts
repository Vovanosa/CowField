import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'

import { isPlainArrowInput, toArrowDirection } from '../../app/arrowKeys'

type UseLevelGridKeyboardArgs = {
  gridElement: HTMLElement | null
  columnCount: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** The open link on each card. One per card, including the admin create card. */
const LEVEL_LINK_SELECTOR = '[data-level-link]'

/**
 * Arrow keys across a page of levels, and off the end of it onto the next page.
 *
 * **Left and right step one level; up and down move a row.** Stepping by one in all four directions
 * was the first sketch and reads as broken on a grid eight cards wide — `Down` that moves to the
 * next *card* rather than the next *row* is not a direction, it is a second `Right`. A row is what
 * the eye sees.
 *
 * **Running off the edge turns the page** rather than stopping, which is the behaviour a player
 * expects from something paginated: level 32 is followed by level 33, and whether a page boundary
 * happens to fall between them is the layout's business, not theirs.
 *
 * Deliberately *not* a roving `tabIndex` like the board's. A board is one widget with a hundred
 * cells and would otherwise cost a hundred tab stops; a page of levels is a short list of links
 * where Tab already does something sensible, so the arrows are a fast path laid over it rather than
 * a replacement for it.
 */
export function useLevelGridKeyboard({
  gridElement,
  columnCount,
  currentPage,
  totalPages,
  onPageChange,
}: UseLevelGridKeyboardArgs) {
  /**
   * Which end of the next page to land on, set before the page changes and consumed after it has
   * rendered. Focus cannot move to a card that does not exist yet, and the page turn is a state
   * update, so the two halves of "go to the next page and keep going in the same direction" are
   * necessarily in different ticks.
   */
  const pendingFocusRef = useRef<'first' | 'last' | null>(null)

  useEffect(() => {
    const pending = pendingFocusRef.current

    if (!pending || !gridElement) {
      return
    }

    pendingFocusRef.current = null

    const links = gridElement.querySelectorAll<HTMLElement>(LEVEL_LINK_SELECTOR)
    const target = pending === 'first' ? links[0] : links[links.length - 1]

    target?.focus()
  }, [currentPage, gridElement])

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (!gridElement || !isPlainArrowInput(event)) {
      return
    }

    const direction = toArrowDirection(event.key, event.code)

    if (!direction) {
      return
    }

    const links = Array.from(gridElement.querySelectorAll<HTMLElement>(LEVEL_LINK_SELECTOR))
    const currentIndex = links.indexOf(document.activeElement as HTMLElement)

    // Focus is on something else inside the grid — the admin edit link on a card, say. Arrows are
    // only meaningful relative to a level, so this leaves the event alone.
    if (currentIndex < 0) {
      return
    }

    const step =
      direction === 'left'
        ? -1
        : direction === 'right'
          ? 1
          : direction === 'up'
            ? -columnCount
            : columnCount
    const nextIndex = currentIndex + step

    event.preventDefault()

    if (nextIndex >= 0 && nextIndex < links.length) {
      links[nextIndex].focus()
      return
    }

    if (nextIndex >= links.length && currentPage < totalPages) {
      pendingFocusRef.current = 'first'
      onPageChange(currentPage + 1)
      return
    }

    if (nextIndex < 0 && currentPage > 1) {
      pendingFocusRef.current = 'last'
      onPageChange(currentPage - 1)
    }
  }

  return handleKeyDown
}
