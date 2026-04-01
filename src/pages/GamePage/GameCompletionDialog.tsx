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
  timeSeconds,
  bestTimeSeconds,
  hasNextLevel,
  onBackdropPointerDown,
  onBackToLevels,
  onNextLevel,
  t,
}: GameCompletionDialogProps) {
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
          {isTakeYourTimeEnabled ? (
            <p className={styles.completionMeta}>{t('Your progress has been saved.')}</p>
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
