import type { PointerEvent as ReactPointerEvent } from 'react'

import {
  isPlainArrowInput,
  toArrowDirection,
  type ArrowDirection,
  type ArrowKeyInput,
} from '../../app/arrowKeys'

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

/**
 * The board's name for a direction is the app's name for a direction — `src/app/arrowKeys.ts` owns
 * the key-to-direction mapping, because the level grid, the difficulty chips and the dropdowns all
 * navigate with the same four keys and `WASD` must not work on one of them and not the others.
 */
export type BoardDirection = ArrowDirection
export type BoardKeyInput = ArrowKeyInput

const STEP_KEY_BY_DIRECTION: Record<BoardDirection, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
}

/**
 * The far-edge move in each direction is the move `Home`/`End`/`PageUp`/`PageDown` already made, so
 * `Shift` + an arrow is a second spelling of an existing behaviour rather than a second
 * implementation of it. One table, one set of edge cases.
 */
const EDGE_KEY_BY_DIRECTION: Record<BoardDirection, string> = {
  up: 'PageUp',
  down: 'PageDown',
  left: 'Home',
  right: 'End',
}

const DIRECTION_BY_EDGE_KEY: Record<string, BoardDirection> = {
  PageUp: 'up',
  PageDown: 'down',
  Home: 'left',
  End: 'right',
}

/** Re-exported so the board's own callers and its harness have one import to reach for. */
export { toArrowDirection as toBoardDirection }

/**
 * Every cell focus passes through on the way from one index to another, in the order it enters
 * them — `from` excluded, `to` included.
 *
 * This is what turns a single `Shift` + arrow into a painted line: the pointer paints each cell it
 * enters, so the keyboard has to know which cells it *would* have entered rather than just where it
 * ended up. For a one-cell step the answer is a one-element array, which is the same code path.
 */
export function cellsBetween(
  fromIndex: number,
  toIndex: number,
  direction: BoardDirection,
  gridSize: number,
): number[] {
  // A move that goes nowhere enters nothing. Guarded rather than assumed: every caller today gets
  // `toIndex` from `moveFocusIndex`, which returns `null` instead of the same cell, but without
  // this the loop below would step away from `toIndex` forever if that ever stopped being true.
  if (fromIndex === toIndex) {
    return []
  }

  const stride = direction === 'left' || direction === 'right' ? 1 : gridSize
  const sign = toIndex > fromIndex ? 1 : -1
  const cells: number[] = []

  for (let index = fromIndex + stride * sign; ; index += stride * sign) {
    cells.push(index)

    if (index === toIndex) {
      break
    }
  }

  return cells
}

export type BoardFocusMove = {
  nextIndex: number
  /** The cells entered on the way, in order, `to` included. */
  path: number[]
  direction: BoardDirection
}

/**
 * The one place that answers "does this key move the board cursor, and where to?".
 *
 * Handles arrows and `WASD` for a single step, the same keys with `Shift` for a jump to the far
 * edge, and `Home`/`End`/`PageUp`/`PageDown` — which the ARIA grid pattern expects and which do the
 * same thing as the `Shift` versions.
 *
 * Returns `null` for a key we do not move on, **and also when the move would leave the board**, so
 * a caller can tell "not ours" from "ours but already at the edge" only by checking the edge
 * itself. Both mean *do nothing*, which is the behaviour that matters.
 */
export function resolveFocusMove(
  input: BoardKeyInput,
  cellIndex: number,
  gridSize: number,
): BoardFocusMove | null {
  // `Ctrl`/`Meta`/`Alt` belong to the browser and to the page-level shortcuts. Without this guard
  // `Ctrl` + `A` would walk the cursor left instead of selecting, and `Ctrl` + `S` would move down.
  if (!isPlainArrowInput(input)) {
    return null
  }

  const direction = toArrowDirection(input.key, input.code)

  if (direction) {
    const key = input.shiftKey ? EDGE_KEY_BY_DIRECTION[direction] : STEP_KEY_BY_DIRECTION[direction]
    const nextIndex = moveFocusIndex(key, cellIndex, gridSize)

    return nextIndex === null
      ? null
      : { nextIndex, path: cellsBetween(cellIndex, nextIndex, direction, gridSize), direction }
  }

  const edgeDirection = DIRECTION_BY_EDGE_KEY[input.key]

  if (!edgeDirection) {
    return null
  }

  const nextIndex = moveFocusIndex(input.key, cellIndex, gridSize)

  return nextIndex === null
    ? null
    : {
        nextIndex,
        path: cellsBetween(cellIndex, nextIndex, edgeDirection, gridSize),
        direction: edgeDirection,
      }
}

/** `Space`, whatever the browser calls it. Older engines report `Spacebar`. */
export function isSpaceKey(key: string) {
  return key === ' ' || key === 'Spacebar'
}
