import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { EmptyState } from '../../components/EmptyState'
import { Button, PageHeader } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getDifficultyOverview } from '../../game/storage/resources'
import { DIFFICULTIES } from '../../game/storage/levelStorage'
import type { Difficulty } from '../../game/types'
import styles from './LevelsPage.module.css'

const difficultyChipClassNames: Record<Difficulty, string> = {
  light: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipLight}`,
  easy: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipEasy}`,
  medium: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipMedium}`,
  hard: styles.difficultyLinkChip,
}

type DifficultyProgressSummary = {
  completed: number
  total: number
  percent: number
}

const emptyProgressSummary: DifficultyProgressSummary = {
  completed: 0,
  total: 0,
  percent: 0,
}

/**
 * A summary for every difficulty this page renders, whatever the API sent.
 *
 * The page always draws all four tiles from `DIFFICULTIES`, but the record used to be built purely
 * from the response — so a response missing one (a difficulty with no levels, a partial read) left
 * `summary` undefined and the very next line, `summary.percent`, threw and took the whole page down
 * with it.
 */
function createProgressSummaryRecord() {
  return Object.fromEntries(
    DIFFICULTIES.map((difficulty) => [difficulty, emptyProgressSummary]),
  ) as Record<Difficulty, DifficultyProgressSummary>
}

export function LevelsPage() {
  const { t } = useTranslation()
  const [progressByDifficulty, setProgressByDifficulty] = useState<
    Record<Difficulty, DifficultyProgressSummary>
  >(createProgressSummaryRecord)
  const [isLoading, setIsLoading] = useState(true)
  // A flag, not a message: translating at render time means the error re-reads in the new
  // language when the player switches it, and keeps `t` out of the effect's dependencies.
  const [hasLoadError, setHasLoadError] = useState(false)
  // Bumping this re-runs the load effect, which is all "Try again" needs to do — the overview cache
  // is only written on success, so a retry really does re-request.
  const [reloadKey, setReloadKey] = useState(0)
  // Only once the retry has finished failing: while a retry is in flight the page shows its
  // skeletons again rather than a stale error next to a dead button.
  const showLoadError = hasLoadError && !isLoading

  useEffect(() => {
    let isActive = true

    async function loadDifficultyProgress() {
      try {
        const overview = await getDifficultyOverview()
        const nextProgress = createProgressSummaryRecord()

        for (const item of overview.difficulties) {
          const completed = item.completedCount
          const total = item.totalCount

          nextProgress[item.difficulty] = {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
          }
        }

        if (!isActive) {
          return
        }

        setProgressByDifficulty(nextProgress)
        setHasLoadError(false)
      } catch (error) {
        reportUnexpectedError(error, 'levels overview')

        if (isActive) {
          setHasLoadError(true)
        }
      } finally {
        // `finally`, not the success path: without it a failed request left the skeletons up
        // permanently and reported nothing.
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadDifficultyProgress()

    return () => {
      isActive = false
    }
  }, [reloadKey])

  return (
    <div className={`${styles.levelsPage} page-shell`}>
      <PageHeader
        backTo="/"
        backLabel={t('Back to home')}
        eyebrow={t('Level Select')}
        title={t('Choose a difficulty to play.')}
      />

      {showLoadError ? (
        <EmptyState
          message={t("Couldn't load your progress. Check your connection and try again.")}
          actions={
            <Button variant="primary" onClick={() => setReloadKey((key) => key + 1)}>
              {t('Try again')}
            </Button>
          }
        />
      ) : (
        <section className={styles.levelsGrid} aria-label={t('Available levels')}>
          {DIFFICULTIES.map((difficulty) => {
            const summary = progressByDifficulty[difficulty]

            return (
              <Link
                key={difficulty}
                className={difficultyChipClassNames[difficulty]}
                to={`/levels/${difficulty}`}
                aria-busy={isLoading}
              >
                <div className={styles.difficultyLinkTop}>
                  <span className={styles.difficultyLinkLabel}>
                    {getDifficultyLabel(t, difficulty)}
                  </span>
                  {isLoading ? (
                    <span className={`${styles.loadingBlock} ${styles.loadingPercent}`} />
                  ) : (
                    <span className={styles.difficultyLinkPercent}>
                      {t('{{percent}}% done', { percent: summary.percent })}
                    </span>
                  )}
                </div>

                <div className={styles.difficultyLinkMeta}>
                  {isLoading ? (
                    <span className={`${styles.loadingBlock} ${styles.loadingText}`} />
                  ) : (
                    <span className={styles.difficultyLinkProgressText}>
                      {t('{{completed}}/{{total}} completed', {
                        completed: summary.completed,
                        total: summary.total,
                      })}
                    </span>
                  )}
                </div>

                <div className={styles.difficultyLinkProgressTrack} aria-hidden="true">
                  <div
                    className={[
                      styles.difficultyLinkProgressFill,
                      isLoading ? styles.difficultyLinkProgressFillLoading : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ width: isLoading ? '38%' : `${summary.percent}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </div>
  )
}
