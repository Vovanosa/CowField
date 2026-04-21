import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PageHeader } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getDifficultyOverview } from '../../game/storage/difficultyOverviewStorage'
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

export function LevelsPage() {
  const { t } = useTranslation()
  const [progressByDifficulty, setProgressByDifficulty] = useState<
    Record<Difficulty, DifficultyProgressSummary>
  >({
    light: emptyProgressSummary,
    easy: emptyProgressSummary,
    medium: emptyProgressSummary,
    hard: emptyProgressSummary,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadDifficultyProgress() {
      const overview = await getDifficultyOverview()
      const results = overview.difficulties.map((item) => {
        const completed = item.completedCount
        const total = item.totalCount
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0

        return [
          item.difficulty,
          {
            completed,
            total,
            percent,
          },
        ] as const
      })

      if (!isActive) {
        return
      }

      setProgressByDifficulty(Object.fromEntries(results) as Record<Difficulty, DifficultyProgressSummary>)
      setIsLoading(false)
    }

    void loadDifficultyProgress()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <div className={`${styles.levelsPage} page-shell`}>
      <PageHeader
        backTo="/"
        backLabel={t('Back to home')}
        eyebrow={t('Level Select')}
        title={t('Choose a difficulty to play.')}
      />

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
    </div>
  )
}
