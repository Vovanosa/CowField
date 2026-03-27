import { type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { CowIcon } from '../icons'
import type { LevelDefinition } from '../../game/types'
import type { CellMark } from '../../pages/GamePage/gameSession.helpers'
import { getBoardCellStyle, getBoardIntersectionStyle } from './GameBoard.helpers'
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
}: GameBoardProps) {
  const { t } = useTranslation()

  return (
    <div
      className={[styles.boardPreview, isSolvedHighlightVisible ? styles.boardPreviewSolved : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={t('Puzzle board')}
    >
      <div
        className={styles.boardPreviewGrid}
        style={{ gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))` }}
      >
        {level.pensByCell.map((_, index) => {
          const isInvalid = invalidBullIndexes.has(index)
          const isActive = activeCellIndex === index
          const hasDot = cellMarks[index] === 'dot'
          const hasBull = cellMarks[index] === 'bull'

          return (
            <button
              key={index}
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
              onPointerDown={(event) => onCellPointerDown(event, index)}
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
