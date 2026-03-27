import { SquarePen } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { EmptyState } from '../../components/EmptyState'
import { Button, Panel, StatusMessage } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import { GameBoardPanel } from './GameBoardPanel'
import { GameCompletionDialog } from './GameCompletionDialog'
import { GameRouteHeader } from './GameRouteHeader'
import { isDifficulty } from './gameSession.helpers'
import { useGameSession } from './useGameSession'
import styles from './GamePage.module.css'

function GamePageScreen() {
  const { difficulty, levelNumber } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
  const isAutoPlaceDotsEnabled = settings?.autoPlaceDotsEnabled === true
  const { t } = useTranslation()
  const {
    level,
    isLoading,
    cellMarks,
    elapsedSeconds,
    isBoardLocked,
    completionModal,
    hasNextLevel,
    isUnlocked,
    canUndo,
    activeCellIndex,
    invalidBullIndexes,
    remainingBulls,
    handleCellPointerDown,
    handleCellPointerEnter,
    handleCellPointerUp,
    handleRestartBoard,
    handleUndoMove,
    handleCompletionBackdropClick: handleCompletionBackdropClose,
  } = useGameSession({
    difficulty,
    levelNumber,
    isGuest,
    isAutoPlaceDotsEnabled,
  })

  if (!isDifficulty(difficulty) || !levelNumber) {
    return (
      <div className={styles.page}>
        <StatusMessage message={t('The requested level route is invalid.')} compact />
      </div>
    )
  }

  const routeLevelLabel = `${getDifficultyLabel(t, difficulty)} / ${t('Level {{levelNumber}}', {
    levelNumber,
  })}`

  if (isLoading) {
    return (
      <div className={styles.page}>
        <GameRouteHeader
          backTo={`/levels/${difficulty}`}
          backLabel={t('Back to levels')}
          levelLabel={routeLevelLabel}
        />
        <Panel className={styles.loadingPanel}>
          <div className={styles.boardPanelHeader}>
            <div className={styles.boardPanelHeaderLeft}>
              <span className={styles.loadingUndoButton} aria-hidden="true" />
            </div>

            <div className={styles.boardPanelHeaderRight}>
              <span className={`${styles.loadingStat} ${styles.boardStatCompact}`} aria-hidden="true" />
              {!isTakeYourTimeEnabled ? (
                <span className={`${styles.loadingStat} ${styles.boardStatCompact}`} aria-hidden="true" />
              ) : null}
            </div>

            <div className={styles.boardToolbar}>
              <span className={styles.loadingRestartButton} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.loadingBoardShell}>
            <div className={styles.loadingBoard} aria-hidden="true">
              <div className={styles.loadingBoardGrid}>
                {Array.from({ length: 36 }, (_, index) => (
                  <span key={index} className={styles.loadingBoardCell} />
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    )
  }

  if (!level) {
    return (
      <div className={styles.page}>
        <GameRouteHeader
          backTo={`/levels/${difficulty}`}
          backLabel={t('Back to levels')}
          levelLabel={routeLevelLabel}
        />
        <EmptyState
          className={styles.emptyState}
          message={t('This level does not exist yet.')}
          actions={
            isAdmin ? (
              <Button to={`/levels/${difficulty}/create`} variant="primary" leadingIcon={<SquarePen size={18} />}>
                {t('Create level')}
              </Button>
            ) : null
          }
        />
      </div>
    )
  }

  if (!isUnlocked && !isAdmin) {
    return (
      <div className={styles.page}>
        <GameRouteHeader
          backTo={`/levels/${difficulty}`}
          backLabel={t('Back to levels')}
          levelLabel={routeLevelLabel}
        />
        <EmptyState
          className={styles.emptyState}
          message={t('This level is locked. Complete the previous level first to open it.')}
        />
      </div>
    )
  }

  function handleCompletionBackdropClick(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleCompletionBackdropClose(event)
    }
  }

  function handleBackToLevels() {
    navigate(`/levels/${difficulty}`)
  }

  function handleNextLevel() {
    if (!hasNextLevel || !level) {
      return
    }

    navigate(`/game/${difficulty}/${level.levelNumber + 1}`)
  }

  return (
    <div className={styles.page}>
      <GameRouteHeader
        backTo={`/levels/${difficulty}`}
        backLabel={t('Back to levels')}
        levelLabel={routeLevelLabel}
      />

      <GameBoardPanel
        level={level}
        difficulty={difficulty}
        cellMarks={cellMarks}
        invalidBullIndexes={invalidBullIndexes}
        isBoardLocked={isBoardLocked}
        activeCellIndex={activeCellIndex}
        canUndo={canUndo}
        hasNextLevel={hasNextLevel}
        isCompletionModalOpen={completionModal?.isOpen === true}
        isAdmin={isAdmin}
        isTakeYourTimeEnabled={isTakeYourTimeEnabled}
        elapsedSeconds={elapsedSeconds}
        remainingBulls={remainingBulls}
        onUndo={handleUndoMove}
        onRestart={handleRestartBoard}
        onNextLevel={handleNextLevel}
        onCellPointerDown={handleCellPointerDown}
        onCellPointerEnter={handleCellPointerEnter}
        onCellPointerUp={handleCellPointerUp}
        t={t}
      />

      {completionModal?.isOpen ? (
        <GameCompletionDialog
          isTakeYourTimeEnabled={isTakeYourTimeEnabled}
          isNewBest={completionModal.isNewBest}
          isFirstClear={completionModal.isFirstClear}
          timeSeconds={completionModal.timeSeconds}
          bestTimeSeconds={completionModal.bestTimeSeconds}
          previousBestTimeSeconds={completionModal.previousBestTimeSeconds}
          hasNextLevel={hasNextLevel}
          onBackdropPointerDown={handleCompletionBackdropClick}
          onBackToLevels={handleBackToLevels}
          onNextLevel={handleNextLevel}
          t={t}
        />
      ) : null}
    </div>
  )
}

export function GamePage() {
  const { difficulty, levelNumber } = useParams()

  return <GamePageScreen key={`${difficulty ?? 'unknown'}-${levelNumber ?? 'unknown'}`} />
}
