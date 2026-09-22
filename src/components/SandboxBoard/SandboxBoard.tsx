import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { GameBoard } from '../GameBoard'
import type { CellMark, LevelDefinition } from '../../game/types'
import styles from './SandboxBoard.module.css'

/**
 * Light level 1, read from `/api/levels/light/1` on 2026-09-20 and frozen here.
 *
 * **Embedded rather than fetched, on purpose.** This renders on the landing page, and the landing
 * page has to be complete before the API is awake — the cold-start notice a few lines above it
 * exists precisely because Render can take tens of seconds to answer the first request of the day.
 * A board that arrives late, or not at all, would be worse than no board. Thirty-six numbers cost
 * nothing to ship.
 *
 * It is a real board and not a mock-up, so what a visitor pokes at here is the same thing they get
 * when they press Play.
 *
 * **There is no solution here and there must never be one.** Nothing on this board is validated:
 * `cowsByCell` is authoring metadata, it is not part of `LevelDefinition`, and this component has
 * no business knowing which cells are right.
 */
const SANDBOX_LEVEL: LevelDefinition = {
  difficulty: 'light',
  levelNumber: 1,
  gridSize: 6,
  pensByCell: [
    5, 5, 5, 2, 2, 2,
    5, 5, 2, 2, 2, 2,
    5, 3, 3, 2, 2, 2,
    5, 3, 3, 1, 2, 1,
    6, 6, 1, 1, 1, 1,
    6, 6, 1, 1, 1, 4,
  ],
  nextLevelNumber: null,
}

/**
 * Nothing is ever invalid here, because nothing is ever checked. Hoisted to a module constant so
 * the identity is stable — a fresh `new Set()` each render would change the prop every time.
 */
const NO_INVALID_BULLS: ReadonlySet<number> = new Set()

const EMPTY_MARKS: readonly CellMark[] = Array.from(
  { length: SANDBOX_LEVEL.gridSize * SANDBOX_LEVEL.gridSize },
  () => 'empty' as const,
)

/**
 * What a drag started on this cell does for the rest of the gesture, or `null` for no drag at all.
 *
 * Deliberately a **local copy** of `DragMode` and the state shape around it rather than an import
 * from `pages/GamePage/gameSession.helpers`. That module reaches into `game/validation` for
 * `getBullsPerGroupForDifficulty`, and importing it here would pull the whole validation graph onto
 * the landing page to reuse a four-line union — on a board that validates nothing. Fifteen lines
 * duplicated is the cheaper half of that trade.
 */
type SandboxDragMode = 'add-dot' | 'clear-dot' | null

type SandboxDragState = {
  isPointerDown: boolean
  startIndex: number | null
  dragMode: SandboxDragMode
  /** Whether the gesture has left the cell it started on. A press that never does is a click. */
  dragged: boolean
  visited: Set<number>
}

function createDragState(): SandboxDragState {
  return {
    isPointerDown: false,
    startIndex: null,
    dragMode: null,
    dragged: false,
    visited: new Set<number>(),
  }
}

/**
 * The same cycle a real cell follows (`useGameSession.handleCellClick`): empty, dot, bull, empty.
 *
 * Duplicated for the same reason as the drag state above, and worth keeping in step with it.
 */
function nextMark(mark: CellMark): CellMark {
  if (mark === 'empty') {
    return 'dot'
  }

  if (mark === 'dot') {
    return 'bull'
  }

  return 'empty'
}

/**
 * A board on the landing page that does nothing except respond.
 *
 * It replaced `og-image.png`, a 105 KB screenshot of a board that was 37% of the page's weight and
 * the single largest thing on it. The file still exists and is still the Open Graph image — it just
 * stopped being something every visitor downloads to look at a picture of the thing they could be
 * playing instead.
 *
 * No timer, no validation, no persistence, no session. Marks live in this component's state and are
 * gone on navigation, which is the whole point: it is somewhere to put a bull before deciding
 * whether you want to press Play.
 *
 * **The gestures are the game's, not a simplified version of them.** The first cut of this cycled a
 * cell on `pointerdown` and ignored the drag handlers entirely, on the theory that a demo only
 * needs clicking — which quietly removed drag-to-dot, the gesture most of the actual solving is
 * done with. A visitor who tries it here and finds it missing learns something false about the
 * game. So the flow below mirrors `useGameSession`: the cycle resolves on `pointerup` and only if
 * the pointer never left the cell, which is what leaves `pointerdown` free to open a drag.
 */
export function SandboxBoard() {
  const { t } = useTranslation()
  const [cellMarks, setCellMarks] = useState<readonly CellMark[]>(EMPTY_MARKS)
  /*
    Read alongside the state, as `useGameSession` does. The pointer handlers have to know what a
    cell holds *now* to decide what a drag is doing, and reading it from the render closure would
    hand them whatever was true when the handler was created.
  */
  const cellMarksRef = useRef(cellMarks)
  const dragStateRef = useRef(createDragState())

  const writeMarks = useCallback((next: readonly CellMark[]) => {
    cellMarksRef.current = next
    setCellMarks(next)
  }, [])

  const cycleCell = useCallback(
    (cellIndex: number) => {
      writeMarks(
        cellMarksRef.current.map((mark, index) => (index === cellIndex ? nextMark(mark) : mark)),
      )
    },
    [writeMarks],
  )

  /** Paint one cell in the drag's mode. **A bull is never touched by a drag**, as in the real game. */
  const paintCell = useCallback(
    (cellIndex: number, dragMode: Exclude<SandboxDragMode, null>) => {
      const next = cellMarksRef.current.map((mark, index) => {
        if (index !== cellIndex || mark === 'bull') {
          return mark
        }

        return dragMode === 'add-dot' ? 'dot' : 'empty'
      })

      if (next.every((mark, index) => mark === cellMarksRef.current[index])) {
        return
      }

      writeMarks(next)
    },
    [writeMarks],
  )

  /*
    A pointer released anywhere other than on a cell still ends the drag. Without this, letting go
    off the edge of the board leaves `isPointerDown` true, and the next pass of the cursor over the
    grid paints a line of dots nobody asked for.
  */
  useEffect(() => {
    function stopDragging() {
      dragStateRef.current = createDragState()
    }

    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  /**
   * The three beats of a drag, shared by the pointer and the keyboard.
   *
   * The demo board is the first board a visitor touches, so it plays the way the real one does:
   * `Space` is the held button and the arrows are the movement. Splitting these out is what lets
   * one gesture arrive through two kinds of event without a second copy of the rules.
   */
  const beginDrag = useCallback((cellIndex: number) => {
    const startMark = cellMarksRef.current[cellIndex]

    dragStateRef.current = {
      isPointerDown: true,
      startIndex: cellIndex,
      /*
        An empty cell starts a dot-laying drag and a dot starts an erasing one, so the gesture
        that fills a run is the same one that clears it. A **bull starts no drag at all**:
        dragging off a bull would either wipe it or smear bulls, and both are worse than doing
        nothing.
      */
      dragMode: startMark === 'empty' ? 'add-dot' : startMark === 'dot' ? 'clear-dot' : null,
      dragged: false,
      visited: new Set<number>(),
    }
  }, [])

  const enterDragCell = useCallback(
    (cellIndex: number) => {
      const dragState = dragStateRef.current

      if (!dragState.isPointerDown || dragState.startIndex === null) {
        return
      }

      // Moving makes this a drag even when there is nothing to paint — a gesture that started on a
      // bull paints nothing, and without this, letting go cycled the bull you started on.
      const wasStillATap = !dragState.dragged
      dragState.dragged = true

      if (dragState.dragMode === null) {
        return
      }

      /*
        The cell the gesture began on is painted here, on the first cell it reaches — not on
        `pointerdown`. Until the pointer moves, the press is still a click, and a click cycles
        rather than paints.
      */
      if (wasStillATap) {
        dragState.visited.add(dragState.startIndex)
        paintCell(dragState.startIndex, dragState.dragMode)
      }

      if (dragState.visited.has(cellIndex)) {
        return
      }

      dragState.visited.add(cellIndex)
      paintCell(cellIndex, dragState.dragMode)
    },
    [paintCell],
  )

  /** Release. A press that never left its cell is a click, and only now is that knowable. */
  const endDrag = useCallback(
    (cellIndex: number | null) => {
      const dragState = dragStateRef.current
      const wasTap =
        dragState.isPointerDown &&
        !dragState.dragged &&
        dragState.startIndex !== null &&
        (cellIndex === null || dragState.startIndex === cellIndex)

      if (wasTap && dragState.startIndex !== null) {
        cycleCell(dragState.startIndex)
      }

      dragStateRef.current = createDragState()
    },
    [cycleCell],
  )

  return (
    <figure className={styles.sandbox}>
      <GameBoard
        level={SANDBOX_LEVEL}
        cellMarks={cellMarks}
        invalidBullIndexes={NO_INVALID_BULLS}
        isBoardLocked={false}
        onCellPointerDown={(event, cellIndex) => {
          // Stops the press turning into a text selection that follows the drag across the board.
          event.preventDefault()
          beginDrag(cellIndex)
        }}
        onCellPointerEnter={(_event, cellIndex) => enterDragCell(cellIndex)}
        onCellPointerUp={(_event, cellIndex) => endDrag(cellIndex)}
        onCellKeyDragStart={beginDrag}
        onCellKeyDragEnter={(cellIndex) => enterDragCell(cellIndex)}
        /*
          The demo keeps the plain tap and ignores the `Shift` modifier: a bull toggle has to
          remember what each bull covered, and a board that exists to show the idea does not need
          the bookkeeping. Everything else — moving, painting, clearing — is the real behaviour.
        */
        onCellKeyDragEnd={() => endDrag(null)}
        onCellKeyDragCancel={() => {
          dragStateRef.current = createDragState()
        }}
        onClearCell={(cellIndex) => {
          if (cellMarksRef.current[cellIndex] === 'empty') {
            return
          }

          writeMarks(cellMarksRef.current.map((mark, index) => (index === cellIndex ? 'empty' : mark)))
        }}
      />
      <figcaption className={styles.caption}>
        {t('Try it yourself.')}
      </figcaption>
    </figure>
  )
}
