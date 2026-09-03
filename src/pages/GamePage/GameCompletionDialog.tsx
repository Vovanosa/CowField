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
  onBackdropPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
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
  onBackdropPointerDown,
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
      onBackdropPointerDown={onBackdropPointerDown}
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
          {isTakeYourTimeEnabled && !hasSaveFailed ? (
            <p className={styles.completionMeta}>{t('Your progress has been saved.')}</p>
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
