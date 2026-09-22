import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useTranslation } from 'react-i18next'

import { getInputModality } from '../../app/inputModality'
import { CowIcon } from '../icons'
import type { LevelDefinition } from '../../game/types'
import type { CellMark } from '../../game/types'
import {
  getBoardCellStyle,
  getBoardIntersectionStyle,
  getCowMarkerPercent,
} from './GameBoard.helpers'

/** What a cow fills on `light`, the size every board used to use. */
const PLAY_COW_BASE_PERCENT = 56
import { isSpaceKey, releaseImplicitPointerCapture, resolveFocusMove } from './GameBoard.keyboard'
import { useCrampedBoardNotice } from './useCrampedBoardNotice'
import styles from './GameBoard.module.css'

type GameBoardProps = {
  level: LevelDefinition
  cellMarks: readonly CellMark[]
  invalidBullIndexes: ReadonlySet<number>
  isBoardLocked: boolean
  isSolvedHighlightVisible?: boolean
  activeCellIndex?: number | null
  onCellPointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) => void
  onCellPointerEnter: (
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) => void
  onCellPointerUp: (
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) => void
  /**
   * The keyboard's three beats, which are the pointer's three beats: `Space` down arms a drag,
   * an arrow under a held `Space` enters a cell, releasing `Space` commits a tap or ends the drag.
   * They land on the same session handlers the pointer does, so the two cannot drift apart.
   */
  onCellKeyDragStart: (cellIndex: number) => void
  onCellKeyDragEnter: (cellIndex: number, timestampMs: number) => void
  onCellKeyDragEnd: (timestampMs: number, withShift: boolean) => void
  /** Focus left the board with `Space` still down: drop the gesture without committing a tap. */
  onCellKeyDragCancel: () => void
  /** `Backspace` — empty this cell whatever is in it. The one action the pointer has no gesture for. */
  onClearCell: (cellIndex: number, timestampMs: number) => void
}

export function GameBoard({
  level,
  cellMarks,
  invalidBullIndexes,
  isBoardLocked,
  isSolvedHighlightVisible = false,
  activeCellIndex = null,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp,
  onCellKeyDragStart,
  onCellKeyDragEnter,
  onCellKeyDragEnd,
  onCellKeyDragCancel,
  onClearCell,
}: GameBoardProps) {
  const { t } = useTranslation()
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([])
  const { cellRef: crampedCellRef, isCramped, wouldRotatingHelp } = useCrampedBoardNotice()
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false)

  /**
   * Roving tabindex: exactly one cell is in the tab order at a time, and the arrow keys move which.
   *
   * The alternative — every cell tabbable — would put up to **100 tab stops** between the board and
   * the next control, which is not navigation, it is an obstacle. One stop in, arrows to move,
   * Enter or Space to act, Tab back out is the standard grid pattern and the only one that scales
   * to a 10×10 board.
   */
  const [focusedCellIndex, setFocusedCellIndex] = useState(0)

  /**
   * Whether `Space` is currently down.
   *
   * The whole drag-paint gesture hangs off this one flag, and it is a ref rather than state because
   * a re-render between `keydown` and the arrow that follows would be a re-render per painted cell.
   */
  const isSpaceHeldRef = useRef(false)

  function focusCell(nextIndex: number) {
    setFocusedCellIndex(nextIndex)
    cellRefs.current[nextIndex]?.focus({ preventScroll: true })
  }

  /**
   * Land on the board when the player arrived by keyboard.
   *
   * Mount is the right moment because `AppShell` keys the route stage by pathname, so every level —
   * including the one *Next Level* goes to — mounts a fresh board. Doing this unconditionally would
   * take the arrow keys away from a mouse player who is only scrolling, which is why it asks.
   */
  useEffect(() => {
    if (getInputModality() !== 'keyboard' || isBoardLocked) {
      return
    }

    cellRefs.current[0]?.focus({ preventScroll: true })
    // Mount only: a level change remounts this component, and re-running on any other state change
    // would yank focus back to cell 0 mid-game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCellKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, cellIndex: number) {
    // `Ctrl`/`Meta` combinations belong to the page-level shortcuts (undo, restart) and to the
    // browser. Returning early leaves the event to bubble to them untouched.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }

    // Space is the held button. `preventDefault` on every press — repeats included — is what stops
    // the document paging down under the board, and it also suppresses the synthetic `click` a
    // `<button>` would fire on release, which would otherwise double-mark the cell.
    if (isSpaceKey(event.key)) {
      event.preventDefault()

      if (event.repeat || isSpaceHeldRef.current || isBoardLocked) {
        return
      }

      isSpaceHeldRef.current = true
      onCellKeyDragStart(cellIndex)
      return
    }

    // Enter deliberately does nothing on a cell: it means *approve* everywhere else in the app, and
    // a board where it also marks is a board where the completion dialog's Enter is ambiguous.
    if (event.key === 'Enter') {
      event.preventDefault()
      return
    }

    if (event.key === 'Backspace') {
      event.preventDefault()

      if (!isBoardLocked) {
        onClearCell(cellIndex, performance.timeOrigin + event.timeStamp)
      }

      return
    }

    const move = resolveFocusMove(event, cellIndex, level.gridSize)

    if (!move) {
      return
    }

    // Otherwise the page scrolls under the board on every arrow press.
    event.preventDefault()

    // Held Space turns the move into a drag: every cell on the way is painted, not just the one the
    // cursor lands on — which is what makes `Shift` + arrow paint a line rather than jump one.
    if (isSpaceHeldRef.current && !isBoardLocked) {
      for (const pathIndex of move.path) {
        onCellKeyDragEnter(pathIndex, performance.timeOrigin + event.timeStamp)
      }
    }

    focusCell(move.nextIndex)
  }

  function handleCellKeyUp(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!isSpaceKey(event.key) || !isSpaceHeldRef.current) {
      return
    }

    isSpaceHeldRef.current = false
    event.preventDefault()

    if (!isBoardLocked) {
      onCellKeyDragEnd(performance.timeOrigin + event.timeStamp, event.shiftKey)
    }
  }

  /**
   * Tab away mid-drag and the `keyup` never arrives, leaving `Space` held forever as far as this
   * component is concerned. Leaving the grid ends the gesture the way lifting the mouse would.
   */
  function handleGridBlur(event: ReactFocusEvent<HTMLDivElement>) {
    if (!isSpaceHeldRef.current || event.currentTarget.contains(event.relatedTarget)) {
      return
    }

    isSpaceHeldRef.current = false
    onCellKeyDragCancel()
  }

  return (
    <div
      className={[styles.boardPreview, isSolvedHighlightVisible ? styles.boardPreviewSolved : '']
        .filter(Boolean)
        .join(' ')}
      // `role="group"` so the label is actually exposed: an `aria-label` on a plain `div` with no
      // role is ignored by most screen readers, so the board had no name at all.
      role="group"
      aria-label={t('Puzzle board')}
    >
      {/*
        Advisory, never blocking. A 10x10 board on a narrow phone renders cells under the 24px
        WCAG minimum, which is worth saying out loud — but a small cell is small, not impossible,
        and a player who wants to zoom in and carry on keeps that choice.
      */}
      {isCramped && !isNoticeDismissed ? (
        <div className={styles.crampedNotice} role="status">
          <p className={styles.crampedNoticeText}>
            {t('This board is cramped on a screen this size.')}{' '}
            {wouldRotatingHelp
              ? t('Turning your phone sideways gives it more room.')
              : t('Light levels are a better fit for narrow screens.')}
          </p>
          <button
            type="button"
            className={styles.crampedNoticeDismiss}
            onClick={() => setIsNoticeDismissed(true)}
          >
            {t('Dismiss')}
          </button>
        </div>
      ) : null}

      <div
        className={styles.boardPreviewGrid}
        onBlur={handleGridBlur}
        style={{
          gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))`,
          '--play-cow-size': `${getCowMarkerPercent(level.gridSize, PLAY_COW_BASE_PERCENT)}%`,
        } as CSSProperties}
      >
        {level.pensByCell.map((penId, index) => {
          const isInvalid = invalidBullIndexes.has(index)
          const isActive = activeCellIndex === index
          const hasDot = cellMarks[index] === 'dot'
          const hasBull = cellMarks[index] === 'bull'
          const row = Math.floor(index / level.gridSize) + 1
          const column = (index % level.gridSize) + 1

          // The whole of what a cell is, in words. Everything here is conveyed visually and only
          // visually today: the pen by its colour, the mark by an icon that is `aria-hidden`, and
          // the rule violation by an animation. Up to 100 buttons announced as just "button".
          const state = hasBull ? t('bull') : hasDot ? t('dot note') : t('empty')
          const label = isInvalid
            ? t('Row {{row}}, column {{column}}, pen {{pen}}. {{state}}. Breaks a rule.', {
                row,
                column,
                pen: penId,
                state,
              })
            : t('Row {{row}}, column {{column}}, pen {{pen}}. {{state}}', {
                row,
                column,
                pen: penId,
                state,
              })

          return (
            <button
              key={index}
              ref={(node) => {
                cellRefs.current[index] = node

                // One cell is enough to know how big every cell is — the grid is uniform.
                if (index === 0) {
                  crampedCellRef(node)
                }
              }}
              type="button"
              className={[
                styles.boardCell,
                isInvalid ? styles.boardCellInvalid : '',
                isActive ? styles.boardCellActive : '',
                hasDot ? styles.boardCellHasDot : '',
                hasBull ? styles.boardCellHasBull : '',
                isSolvedHighlightVisible && hasBull ? styles.boardCellSolvedBull : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={getBoardCellStyle(level, index, isInvalid, isActive)}
              aria-label={label}
              tabIndex={index === focusedCellIndex ? 0 : -1}
              data-board-cell=""
              onFocus={() => setFocusedCellIndex(index)}
              onKeyDown={(event) => handleCellKeyDown(event, index)}
              onKeyUp={handleCellKeyUp}
              onPointerDown={(event) => {
                releaseImplicitPointerCapture(event)
                onCellPointerDown(event, index)

                // Hand the board to the keyboard at the cell that was clicked. `handleCellPointerDown`
                // calls `preventDefault`, which is what suppresses the focus a click would normally
                // give a button — so without this a player who navigates by mouse and plays by
                // keyboard has to tab in from the top of the page every time.
                // `preventScroll` because a cell near the edge of a large board would otherwise jump
                // the page under the pointer mid-drag.
                event.currentTarget.focus({ preventScroll: true })
              }}
              onPointerEnter={(event) => onCellPointerEnter(event, index)}
              onPointerUp={(event) => onCellPointerUp(event, index)}
              onDragStart={(event) => event.preventDefault()}
              disabled={isBoardLocked}
            >
              {hasDot ? <span className={styles.boardCellDot} /> : null}
              {hasBull ? <CowIcon className={styles.playCowMarker} /> : null}
            </button>
          )
        })}

        {Array.from({ length: Math.max(level.gridSize - 1, 0) }, (_, rowIndex) =>
          Array.from({ length: Math.max(level.gridSize - 1, 0) }, (_, columnIndex) => (
            <span
              key={`intersection-${rowIndex + 1}-${columnIndex + 1}`}
              className={styles.boardGridIntersection}
              style={getBoardIntersectionStyle(level, rowIndex + 1, columnIndex + 1)}
              aria-hidden="true"
            />
          )),
        )}
      </div>
    </div>
  )
}
