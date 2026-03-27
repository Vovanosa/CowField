import { SquarePen, TimerReset, Undo2 } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { GameBoard } from '../../components/GameBoard'
import { Button, Panel } from '../../components/ui'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import type { LevelDefinition } from '../../game/types'
import styles from './GamePage.module.css'

type GameBoardPanelProps = {
  level: LevelDefinition
  difficulty: string
  cellMarks: Array<'empty' | 'dot' | 'bull'>
  invalidBullIndexes: Set<number>
  isBoardLocked: boolean
  activeCellIndex: number | null
  canUndo: boolean
  hasNextLevel: boolean
  isAdmin: boolean
  isTakeYourTimeEnabled: boolean
  elapsedSeconds: number
  remainingBulls: number
  onUndo: () => void
  onRestart: () => void
  onNextLevel: () => void
  onCellPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, cellIndex: number) => void
  onCellPointerEnter: (event: ReactPointerEvent<HTMLButtonElement>, cellIndex: number) => void
  onCellPointerUp: (event: ReactPointerEvent<HTMLButtonElement>, cellIndex: number) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function GameBoardPanel({
  level,
  difficulty,
  cellMarks,
  invalidBullIndexes,
  isBoardLocked,
  activeCellIndex,
  canUndo,
  hasNextLevel,
  isAdmin,
  isTakeYourTimeEnabled,
  elapsedSeconds,
  remainingBulls,
  onUndo,
  onRestart,
  onNextLevel,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp,
  t,
}: GameBoardPanelProps) {
  return (
    <section className={styles.layout}>
      <Panel>
        <div className={styles.boardPanelHeader}>
          <div className={styles.boardPanelHeaderLeft}>
            <Button
              className={styles.boardUndoButton}
              onClick={onUndo}
              disabled={!canUndo || isBoardLocked}
              aria-label={t('Undo')}
              data-tooltip={t('Undo')}
              iconOnly
              leadingIcon={<Undo2 size={18} />}
            >
              {null}
            </Button>
          </div>

          <div className={styles.boardPanelHeaderRight}>
            <div className={[styles.boardStat, styles.boardStatCompact].join(' ')}>
              <p className={styles.boardPanelLabel}>{t('Remaining bulls')}</p>
              <strong className={styles.boardPanelValue}>{remainingBulls}</strong>
            </div>
            {!isTakeYourTimeEnabled ? (
              <div className={[styles.boardStat, styles.boardStatCompact].join(' ')}>
                <p className={styles.boardPanelLabel}>{t('Timer')}</p>
                <strong className={styles.boardPanelValue}>{formatElapsedTime(elapsedSeconds)}</strong>
              </div>
            ) : null}
          </div>

          <div className={styles.boardToolbar}>
            {isBoardLocked && hasNextLevel ? (
              <Button variant="primary" className={styles.boardNextButton} onClick={onNextLevel}>
                {t('Next Level')}
              </Button>
            ) : null}

            <Button
              className={styles.boardResetButton}
              onClick={onRestart}
              leadingIcon={<TimerReset size={18} />}
            >
              {t('Restart')}
            </Button>

            {isAdmin ? (
              <Button
                to={`/levels/${difficulty}/${level.levelNumber}/edit`}
                leadingIcon={<SquarePen size={18} />}
              >
                {t('Edit level')}
              </Button>
            ) : null}
          </div>
        </div>

        <GameBoard
          level={level}
          cellMarks={cellMarks}
          invalidBullIndexes={invalidBullIndexes}
          isBoardLocked={isBoardLocked}
          activeCellIndex={activeCellIndex}
          onCellPointerDown={onCellPointerDown}
          onCellPointerEnter={onCellPointerEnter}
          onCellPointerUp={onCellPointerUp}
        />
      </Panel>
    </section>
  )
}
