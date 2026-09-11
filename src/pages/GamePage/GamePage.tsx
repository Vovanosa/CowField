import { SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useNavigate } from '../../app/navigation'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { useRole } from '../../app/role'
import { EmptyState } from '../../components/EmptyState'
import { Button, Panel, StatusMessage, Toast } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import { GameAccessGate } from './GameAccessGate'
import { GameBoardPanel } from './GameBoardPanel'
import { GameCompletionDialog } from './GameCompletionDialog'
import { GameRouteHeader } from './GameRouteHeader'
import { isDifficulty } from './gameSession.helpers'
import { useGameSession } from './useGameSession'
import styles from './GamePage.module.css'

/** Long enough to read four words, short enough not to sit over the board. */
const SHARE_TOAST_DURATION_MS = 2600

function GamePageScreen() {
  const { difficulty, levelNumber } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
  const isAutoPlaceDotsEnabled = settings?.autoPlaceDotsEnabled === true
  const { t } = useTranslation()
  // One line, shown after a clipboard copy. `navigator.share` needs none — the native sheet is its
  // own confirmation — so this only ever appears on the fallback path.
  const [shareMessage, setShareMessage] = useState<string | null>(null)

  // Clears itself. Keyed on the message rather than on a ref, so sharing twice in a row restarts
  // the timer instead of the first copy dismissing the second.
  useEffect(() => {
    if (!shareMessage) {
      return
    }

    const timer = window.setTimeout(() => setShareMessage(null), SHARE_TOAST_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [shareMessage])

  const {
    level,
    isLoading,
    hasLoadError,
    handleRetryLoad,
    cellMarks,
    elapsedSeconds,
    isBoardLocked,
    completionModal,
    nextLevelNumber,
    canUndo,
    activeCellIndex,
    invalidBullIndexes,
    remainingBulls,
    handleCellActivate,
    handleCellPointerDown,
    handleCellPointerEnter,
    handleCellPointerUp,
    handleRestartBoard,
    handleUndoMove,
    handleCloseCompletionModal,
    handleRetrySaveCompletion,
    setCompletionModal,
  } = useGameSession({
    difficulty,
    levelNumber,
    isGuest,
    isAutoPlaceDotsEnabled,
  })

  // Computed before the invalid-route return below, because the `useDocumentMeta` call has to run
  // unconditionally — a hook after an early return is a hook that sometimes does not happen.
  const routeLevelLabel =
    isDifficulty(difficulty) && levelNumber
      ? `${getDifficultyLabel(t, difficulty)} / ${t('Level {{levelNumber}}', { levelNumber })}`
      : t('The requested level route is invalid.')

  /*
    `noindex`, still — but for a different reason than before P18.

    It used to be that a crawler only ever saw this route redirect to a login form. The route is
    public now, and the reason survives the change: a board behind a gate is a thin page, and a
    thousand of them is the doorway-page pattern (decision D3). **Shareable, not searchable.** The
    listing pages are what this programme asks Google to rank; `robots.txt` keeps `/game/` disallowed
    to match.

    The title still names the level, which is what makes browser history, tabs and a shared link
    preview usable.
  */
  useDocumentMeta({ title: brandedTitle(routeLevelLabel), robots: 'noindex' })

  if (!isDifficulty(difficulty) || !levelNumber) {
    return (
      <div className={styles.page}>
        <StatusMessage message={t('The requested level route is invalid.')} compact />
      </div>
    )
  }

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

  // Checked before the `!level` branch below: a failed request also leaves `level` null, and
  // telling the player the level does not exist is the wrong answer to a dropped connection.
  if (hasLoadError) {
    return (
      <div className={styles.page}>
        <GameRouteHeader
          backTo={`/levels/${difficulty}`}
          backLabel={t('Back to levels')}
          levelLabel={routeLevelLabel}
        />
        <EmptyState
          className={styles.emptyState}
          message={t("Couldn't load this level. Check your connection and try again.")}
          actions={
            <Button variant="primary" onClick={handleRetryLoad}>
              {t('Try again')}
            </Button>
          }
        />
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

  function handleBackToLevels() {
    setCompletionModal((currentModal) => (currentModal ? { ...currentModal, isOpen: false } : null))
    navigate(`/levels/${difficulty}`)
  }

  // The two panels below only need to know *whether* there is one; the number itself is only used
  // to navigate.
  const hasNextLevel = nextLevelNumber !== null

  function handleNextLevel() {
    if (nextLevelNumber === null) {
      return
    }

    setCompletionModal((currentModal) => (currentModal ? { ...currentModal, isOpen: false } : null))
    // The **actual** next level, from the server. This used to be `levelNumber + 1`, which dead-ended
    // on the gap a deleted level leaves behind: the button was enabled and the page it navigated to
    // did not exist.
    navigate(`/game/${difficulty}/${nextLevelNumber}`)
  }

  return (
    <div className={styles.page}>
      <GameRouteHeader
        backTo={`/levels/${difficulty}`}
        backLabel={t('Back to levels')}
        levelLabel={routeLevelLabel}
      />

      {/*
        The board is built and rendered the same way for everyone; the gate is a layer over it for a
        visitor with no session, and renders nothing at all for a player. Wrapping rather than
        branching is what lets *Play as guest* unblur **in place** — the board underneath is already
        loaded, so there is no second wait and no chance of landing somewhere else.
      */}
      <GameAccessGate t={t}>
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
          onCellActivate={handleCellActivate}
          onShared={setShareMessage}
          t={t}
        />
      </GameAccessGate>

      {shareMessage ? <Toast title={shareMessage} /> : null}

      {completionModal?.isOpen ? (
        <GameCompletionDialog
          isTakeYourTimeEnabled={isTakeYourTimeEnabled}
          isNewBest={completionModal.isNewBest}
          isFirstClear={completionModal.isFirstClear}
          timeSeconds={completionModal.timeSeconds}
          bestTimeSeconds={completionModal.bestTimeSeconds}
          previousBestTimeSeconds={completionModal.previousBestTimeSeconds}
          saveState={completionModal.saveState}
          hasNextLevel={hasNextLevel}
          onClose={handleCloseCompletionModal}
          onBackToLevels={handleBackToLevels}
          onNextLevel={handleNextLevel}
          onRetrySave={handleRetrySaveCompletion}
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
