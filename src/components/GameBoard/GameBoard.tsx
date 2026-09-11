import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useTranslation } from 'react-i18next'

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
import { moveFocusIndex, releaseImplicitPointerCapture } from './GameBoard.keyboard'
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
   * A cell was activated by keyboard. Deliberately the **same** operation a tap performs — the
   * board has one rule for what a cell does, and a second input method must not invent a second.
   */
  onCellActivate: (cellIndex: number, timestampMs: number) => void
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
  onCellActivate,
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

  function focusCell(nextIndex: number) {
    setFocusedCellIndex(nextIndex)
    cellRefs.current[nextIndex]?.focus()
  }

  function handleCellKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, cellIndex: number) {
    // Enter and Space are handled here rather than through `onClick`, because a pointer interaction
    // can also produce a click and the two would double-fire — placing a mark and then immediately
    // cycling it again. Preventing the default stops the synthetic click a button would emit.
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()

      if (!isBoardLocked) {
        onCellActivate(cellIndex, performance.timeOrigin + event.timeStamp)
      }

      return
    }

    const nextIndex = moveFocusIndex(event.key, cellIndex, level.gridSize)

    if (nextIndex === null) {
      return
    }

    // Otherwise the page scrolls under the board on every arrow press.
    event.preventDefault()
    focusCell(nextIndex)
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
              onFocus={() => setFocusedCellIndex(index)}
              onKeyDown={(event) => handleCellKeyDown(event, index)}
              onPointerDown={(event) => {
                releaseImplicitPointerCapture(event)
                onCellPointerDown(event, index)
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
