import { useEffect, useRef, useState } from 'react'

/**
 * WCAG 2.2's Target Size (Minimum), 2.5.8. Below this a tap target is officially too small, and it
 * is the number the responsiveness survey measured against.
 */
const MINIMUM_TARGET_SIZE_PX = 24

type CrampedBoardNotice = {
  /** Attach to any one cell — the board is square, so one cell describes all of them. */
  cellRef: (node: HTMLElement | null) => void
  /** True once a cell is genuinely rendering below the minimum target size. */
  isCramped: boolean
  /** True when the viewport is taller than it is wide, so rotating would actually help. */
  wouldRotatingHelp: boolean
}

/**
 * Watches how big the board's cells actually end up, so the player can be told when it is too
 * small rather than left to squint.
 *
 * **Measured, not guessed from the viewport width.** The survey found `medium`/`hard` (10×10)
 * rendering 21–33px cells on phones — under the 24px minimum at 320px and marginal at 360px — while
 * `light` (6×6) is comfortable everywhere. A width breakpoint would have to encode that whole
 * table, and would then be wrong the moment the board's sizing changes, in landscape, or at a
 * non-default zoom. A `ResizeObserver` on a real cell is right in all of those cases by
 * construction, and needs no per-difficulty knowledge at all.
 *
 * Deliberately advisory: the notice this drives does not block play. A 21px cell is small, not
 * impossible, and a player who wants to zoom in and carry on should be able to.
 */
export function useCrampedBoardNotice(): CrampedBoardNotice {
  const [isCramped, setIsCramped] = useState(false)
  const [wouldRotatingHelp, setWouldRotatingHelp] = useState(false)
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [])

  function cellRef(node: HTMLElement | null) {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!node || typeof ResizeObserver === 'undefined') {
      return
    }

    function measure(width: number) {
      setIsCramped(width > 0 && width < MINIMUM_TARGET_SIZE_PX)
      setWouldRotatingHelp(
        typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
      )
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (entry) {
        measure(entry.contentRect.width)
      }
    })

    observer.observe(node)
    observerRef.current = observer
    measure(node.getBoundingClientRect().width)
  }

  return { cellRef, isCramped, wouldRotatingHelp }
}
