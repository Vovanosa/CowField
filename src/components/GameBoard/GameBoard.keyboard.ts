import type { PointerEvent as ReactPointerEvent } from 'react'

/**
 * Hands back the implicit pointer capture a touch gesture takes on `pointerdown`.
 *
 * **This is what makes drag-paint work on a phone.** For touch (and pen), the browser silently
 * captures the pointer to the element the gesture started on, so every later event for that pointer
 * is retargeted there — `pointerenter` never fires on the cells the finger moves over, and a drag
 * across ten cells paints exactly one. On a mouse there is no implicit capture, which is why the
 * behaviour looked correct everywhere it was being developed.
 *
 * Releasing it restores normal hit-testing for the rest of the gesture, which is what the drag
 * handlers were written against. Harmless where there was no capture to release, hence the guard
 * rather than a device check.
 */
export function releaseImplicitPointerCapture(event: ReactPointerEvent<HTMLElement>) {
  const target = event.currentTarget

  if (target.hasPointerCapture?.(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

/**
 * Where an arrow key moves focus on a square board, or `null` if the key is not one we handle.
 *
 * **Deliberately does not wrap.** Wrapping from the end of one row to the start of the next reads
 * as the board scrolling under you; stopping at the edge means the shape of the grid is learnable
 * by feel, which for a puzzle whose whole structure is spatial is the point. `Home` and `End` move
 * within the current row, `PageUp`/`PageDown` to the first and last row of the column.
 */
export function moveFocusIndex(key: string, cellIndex: number, gridSize: number): number | null {
  const row = Math.floor(cellIndex / gridSize)
  const column = cellIndex % gridSize

  switch (key) {
    case 'ArrowRight':
      return column < gridSize - 1 ? cellIndex + 1 : null
    case 'ArrowLeft':
      return column > 0 ? cellIndex - 1 : null
    case 'ArrowDown':
      return row < gridSize - 1 ? cellIndex + gridSize : null
    case 'ArrowUp':
      return row > 0 ? cellIndex - gridSize : null
    case 'Home':
      return column > 0 ? row * gridSize : null
    case 'End':
      return column < gridSize - 1 ? row * gridSize + (gridSize - 1) : null
    case 'PageUp':
      return row > 0 ? column : null
    case 'PageDown':
      return row < gridSize - 1 ? (gridSize - 1) * gridSize + column : null
    default:
      return null
  }
}
