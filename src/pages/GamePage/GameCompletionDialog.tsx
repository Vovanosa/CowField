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
  onBackdropPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onBackToLevels: () => void
  onNextLevel: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function GameCompletionDialog({
  isTakeYourTimeEnabled,
  isNewBest,
  isFirstClear,
  timeSeconds,
  bestTimeSeconds,
  previousBestTimeSeconds,
  hasNextLevel,
  onBackdropPointerDown,
  onBackToLevels,
  onNextLevel,
  t,
}: GameCompletionDialogProps) {
  const timeDeltaSeconds =
    previousBestTimeSeconds === null ? null : Math.abs(timeSeconds - previousBestTimeSeconds)
  const statusLabel = isTakeYourTimeEnabled
    ? t('Progress saved.')
    : isFirstClear
      ? t('First clear')
      : isNewBest
        ? t('New best time!')
        : t('Completed again')

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
          <p className={styles.completionStatus}>{statusLabel}</p>
          {!isTakeYourTimeEnabled ? (
            <p className={styles.completionTime}>{formatElapsedTime(timeSeconds)}</p>
          ) : null}
          {!isTakeYourTimeEnabled && isFirstClear && bestTimeSeconds !== null ? (
            <p className={styles.completionMeta}>
              {t('Best time set at {{time}}.', {
                time: formatElapsedTime(bestTimeSeconds),
              })}
            </p>
          ) : null}
          {!isTakeYourTimeEnabled && !isFirstClear && bestTimeSeconds !== null ? (
            <p className={styles.completionMeta}>
              {t('Best time: {{time}}', {
                time: formatElapsedTime(bestTimeSeconds),
              })}
            </p>
          ) : null}
          {!isTakeYourTimeEnabled && isNewBest && previousBestTimeSeconds !== null && timeDeltaSeconds !== null ? (
            <p className={styles.completionBest}>
              {t('{{delta}} faster than your previous best.', {
                delta: formatElapsedTime(timeDeltaSeconds),
              })}
            </p>
          ) : null}
          {!isTakeYourTimeEnabled && !isNewBest && previousBestTimeSeconds !== null && timeDeltaSeconds !== null ? (
            <p className={styles.completionMeta}>
              {t('{{delta}} slower than your best.', {
                delta: formatElapsedTime(timeDeltaSeconds),
              })}
            </p>
          ) : null}
          {hasNextLevel ? (
            <p className={styles.completionHint}>{t('Next level is ready.')}</p>
          ) : (
            <p className={styles.completionHint}>{t('You completed the last available level.')}</p>
          )}
          {isTakeYourTimeEnabled ? (
            <p className={styles.completionBest}>{t('Your progress has been saved.')}</p>
          ) : null}
        </>
      }
      actions={
        <>
          <Button onClick={onBackToLevels}>{t('Back')}</Button>
          <Button variant="primary" onClick={onNextLevel} disabled={!hasNextLevel}>
            {t('Next Level')}
          </Button>
        </>
      }
    />
  )
}
