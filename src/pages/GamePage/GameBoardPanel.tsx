import { SquarePen, Timer, TimerReset, Undo2 } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { GameBoard } from '../../components/GameBoard'
import { ShareLevelButton } from './ShareLevelButton'
import { CowIcon } from '../../components/icons'
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
  isCompletionModalOpen: boolean
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
  onCellActivate: (cellIndex: number, timestampMs: number) => void
  onShared: (message: string) => void
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
  onCellActivate,
  onShared,
  t,
}: GameBoardPanelProps) {
  return (
    <section className={styles.boardLayout}>
      <Panel className={styles.boardPanel}>
        <div className={styles.boardPanelHeader}>
          <div className={styles.boardControlsRow}>
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

            <div className={styles.boardStatsRow}>
              {/* The icon shows only once the label collapses below 640px, so the pill still says
                  what it is when there is no room for the words. */}
              <div className={[styles.boardStat, styles.boardStatCompact].join(' ')}>
                <CowIcon className={styles.boardStatIcon} />
                <p className={styles.boardPanelLabel}>{t('Remaining bulls')}</p>
                <strong className={styles.boardPanelValue}>{remainingBulls}</strong>
              </div>
              {!isTakeYourTimeEnabled ? (
                <div className={[styles.boardStat, styles.boardStatCompact].join(' ')}>
                  <Timer className={styles.boardStatIcon} size={18} aria-hidden="true" />
                  <p className={styles.boardPanelLabel}>{t('Timer')}</p>
                  <strong className={styles.boardPanelValue}>{formatElapsedTime(elapsedSeconds)}</strong>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.boardToolbar}>
            {isBoardLocked && hasNextLevel ? (
              <Button
                variant="primary"
                className={[styles.boardNextButton, styles.boardActionButton].join(' ')}
                onClick={onNextLevel}
              >
                {t('Next Level')}
              </Button>
            ) : null}

            {/* `Next Level` above deliberately keeps its label — it is the primary action after a
                solve, and it is worth a second row on a narrow screen. These two collapse. */}
            <Button
              className={[
                styles.boardResetButton,
                styles.boardActionButton,
                styles.boardIconAction,
              ].join(' ')}
              onClick={onRestart}
              leadingIcon={<TimerReset size={18} />}
              collapseLabelOnNarrow
            >
              {t('Restart')}
            </Button>

            {/* Always available, signed in or not — see `ShareLevelButton` for why it carries no
                time. It sits with Restart rather than after the solve, because the reason to send
                someone a level is usually that you are looking at it. */}
            <ShareLevelButton
              className={[styles.boardActionButton, styles.boardIconAction].join(' ')}
              t={t}
              onShared={onShared}
            />

            {isAdmin ? (
              <Button
                to={`/levels/${difficulty}/${level.levelNumber}/edit`}
                className={[styles.boardActionButton, styles.boardIconAction].join(' ')}
                leadingIcon={<SquarePen size={18} />}
                collapseLabelOnNarrow
              >
                {t('Edit level')}
              </Button>
            ) : null}
          </div>
        </div>

        {/* The stage takes whatever height the control bar leaves and becomes a size container, so
            the board can size itself against real leftover space instead of a hardcoded guess at
            how tall the bar is — a guess that was wrong for two-row bars, which happen in Ukrainian
            and for admins. */}
        <div className={styles.boardStage}>
          <GameBoard
            level={level}
            cellMarks={cellMarks}
            invalidBullIndexes={invalidBullIndexes}
            isBoardLocked={isBoardLocked}
            isSolvedHighlightVisible={isBoardLocked}
            activeCellIndex={activeCellIndex}
            onCellPointerDown={onCellPointerDown}
            onCellPointerEnter={onCellPointerEnter}
            onCellPointerUp={onCellPointerUp}
            onCellActivate={onCellActivate}
          />
        </div>
      </Panel>
    </section>
  )
}
