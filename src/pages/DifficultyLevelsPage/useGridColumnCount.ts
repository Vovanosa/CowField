import { useLayoutEffect, useState } from 'react'

/**
 * Used before the grid has been measured, and if `ResizeObserver` is missing. Six is what an 860px
 * `.page-shell` settles on, which is the widest the container ever gets.
 */
const FALLBACK_COLUMN_COUNT = 6

function readColumnCount(grid: HTMLElement) {
  // For a laid-out grid container this computes to a space-separated list of *used* track sizes
  // ("130px 130px ..."), so its length is the column count `auto-fill` chose. There is no other way
  // to learn that without re-deriving the track sizing by hand.
  const columns = getComputedStyle(grid).gridTemplateColumns.trim()

  // An unlaid-out or `display: none` element hands back the *specified* value instead, which still
  // contains `repeat()`/`minmax()` and would otherwise split into a nonsense count of 2.
  if (!columns || columns === 'none' || columns.includes('(')) {
    return FALLBACK_COLUMN_COUNT
  }

  return columns.split(/\s+/).length
}

/**
 * How many columns the grid actually has, measured rather than inferred from the viewport.
 *
 * Takes the element (via a callback ref) rather than a `RefObject` on purpose: the grid is
 * conditionally rendered, so the effect has to re-run when it appears and disappears, and a ref
 * object never triggers that.
 */
export function useGridColumnCount(element: HTMLElement | null) {
  const [columnCount, setColumnCount] = useState(FALLBACK_COLUMN_COUNT)

  useLayoutEffect(() => {
    if (!element) {
      return
    }

    // Passed in rather than closed over: TypeScript will not carry the null-narrowing above into a
    // nested function, even for a const.
    function measure(grid: HTMLElement) {
      // Bailing out when the count is unchanged is what stops a feedback loop — a new column count
      // changes the page size, which changes the row count, which changes this element's height and
      // fires the observer again. Returning `current` makes React skip that re-render.
      setColumnCount((current) => {
        const next = readColumnCount(grid)

        return next === current ? current : next
      })
    }

    // Runs before paint, so the loading skeletons are already the right count on the first frame.
    // Direct, not deferred, so there is no flash of the fallback count.
    measure(element)

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    let queuedFrame: number | null = null

    // Deferred to the next frame on purpose. A new column count changes the page size, which changes
    // the row count, which changes this very element's height — and resizing an observed element
    // from inside its own callback makes the browser emit "ResizeObserver loop completed with
    // undelivered notifications". That is harmless in itself, but it dispatches a window `error`
    // event, which `registerGlobalErrorHandlers` would report as an unexpected error on every
    // resize. Mutating a frame later keeps each observation cycle clean.
    const observer = new ResizeObserver(() => {
      if (queuedFrame !== null) {
        return
      }

      queuedFrame = requestAnimationFrame(() => {
        queuedFrame = null
        measure(element)
      })
    })

    observer.observe(element)

    return () => {
      observer.disconnect()

      if (queuedFrame !== null) {
        cancelAnimationFrame(queuedFrame)
      }
    }
  }, [element])

  return columnCount
}
