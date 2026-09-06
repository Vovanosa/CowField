import { Dialog } from '../../components/Dialog'
import { Button } from '../../components/ui'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import styles from './GamePage.module.css'

type GameCompletionDialogProps = {
  isTakeYourTimeEnabled: boolean
  isNewBest: boolean
  isFirstClear: boolean
  timeSeconds: number
  bestTimeSeconds: number | null
  previousBestTimeSeconds: number | null
  hasNextLevel: boolean
  saveState: 'saving' | 'saved' | 'failed'
  onClose: () => void
  onBackToLevels: () => void
  onNextLevel: () => void
  onRetrySave: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function GameCompletionDialog({
  isTakeYourTimeEnabled,
  isNewBest,
  timeSeconds,
  bestTimeSeconds,
  hasNextLevel,
  saveState,
  onClose,
  onBackToLevels,
  onNextLevel,
  onRetrySave,
  t,
}: GameCompletionDialogProps) {
  const hasSaveFailed = saveState === 'failed'

  return (
    <Dialog
      title={t('Level complete')}
      labelledById="game-completion-title"
      onClose={onClose}
      className={styles.completionDialog}
      descriptionClassName={styles.completionDescription}
      actionsClassName={styles.completionActions}
      description={
        <>
          {!isTakeYourTimeEnabled ? (
            <p className={styles.completionTime}>{formatElapsedTime(timeSeconds)}</p>
          ) : null}
          {!isTakeYourTimeEnabled && isNewBest ? (
            <p className={styles.completionMeta}>{t('New best time.')}</p>
          ) : null}
          {!isTakeYourTimeEnabled && !isNewBest && bestTimeSeconds !== null ? (
            <p className={styles.completionMeta}>
              {t('Best time: {{time}}', {
                time: formatElapsedTime(bestTimeSeconds),
              })}
            </p>
          ) : null}
          {!hasNextLevel ? (
            <p className={styles.completionHint}>{t('You completed the last available level.')}</p>
          ) : null}
          {/*
            Follows `saveState`, not "not failed". The dialog opens the instant the board is solved
            and the write starts then, so "has been saved" was a promise made before the request had
            an answer — and if it went on to fail, the player had already been told the opposite.
          */}
          {isTakeYourTimeEnabled && saveState === 'saving' ? (
            <p className={styles.completionMeta} role="status">
              {t('Saving your progress...')}
            </p>
          ) : null}
          {isTakeYourTimeEnabled && saveState === 'saved' ? (
            <p className={styles.completionMeta} role="status">
              {t('Your progress has been saved.')}
            </p>
          ) : null}
          {hasSaveFailed ? (
            <p className={styles.completionHint} role="alert">
              {t("Couldn't save your progress. Check your connection and try again.")}
            </p>
          ) : null}
        </>
      }
      actions={
        <>
          <Button onClick={onBackToLevels}>{t('Back')}</Button>
          {hasSaveFailed ? (
            <Button variant="primary" onClick={onRetrySave}>
              {t('Try again')}
            </Button>
          ) : (
            <Button variant="primary" onClick={onNextLevel} disabled={!hasNextLevel}>
              {t('Next Level')}
            </Button>
          )}
        </>
      }
    />
  )
}
