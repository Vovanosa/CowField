import { ArrowLeft, Clock3, Flag, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PageIntro } from '../../components/PageIntro'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getPlayerStatistics } from '../../game/storage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import type { Difficulty, PlayerStatisticsSummary } from '../../game/types'
import styles from './StatisticsPage.module.css'

const difficultyCardClassNames: Record<Difficulty, string> = {
  light: styles.difficultyCardLight,
  easy: styles.difficultyCardEasy,
  medium: styles.difficultyCardMedium,
  hard: styles.difficultyCardHard,
}

function formatFastestLevel(
  fastestLevel: PlayerStatisticsSummary['byDifficulty'][number]['fastestLevel'],
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!fastestLevel) {
    return t('No completed level')
  }

  return `${t('Level {{levelNumber}}', { levelNumber: fastestLevel.levelNumber })} | ${formatElapsedTime(fastestLevel.timeSeconds)}`
}

export function StatisticsPage() {
  const [statistics, setStatistics] = useState<PlayerStatisticsSummary | null>(null)
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = settings?.takeYourTimeEnabled === true
  const { t } = useTranslation()

  useEffect(() => {
    let isActive = true

    async function loadStatistics() {
      const nextStatistics = await getPlayerStatistics()

      if (!isActive) {
        return
      }

      setStatistics(nextStatistics)
    }

    void loadStatistics()

    return () => {
      isActive = false
    }
  }, [])

  const overviewItems = useMemo(() => {
    if (!statistics) {
      return []
    }

    const leadingDifficulty = statistics.byDifficulty.reduce((leader, item) =>
      item.completedLevels > leader.completedLevels ? item : leader,
    )

    return [
      {
        title: t('Most progress'),
        value: leadingDifficulty.completedLevels > 0
          ? getDifficultyLabel(t, leadingDifficulty.difficulty)
          : t('No data'),
        suffix: leadingDifficulty.completedLevels > 0
          ? t('{{count}} completed levels', { count: leadingDifficulty.completedLevels })
          : '',
        inlineValue: true,
        icon: Flag,
      },
      {
        title: t('Completed levels'),
        value: String(statistics.totalCompletedLevels),
        icon: Flag,
      },
      {
        title: t('Placed bulls'),
        value: String(statistics.totalBullPlacements),
        icon: Trophy,
      },
      {
        title: t('Total completion time'),
        value: isTakeYourTimeEnabled
          ? t('Hidden')
          : formatElapsedTime(statistics.totalCompletionTimeSeconds),
        icon: Clock3,
      },
    ]
  }, [isTakeYourTimeEnabled, statistics, t])

  return (
    <div className={`${styles.statisticsPage} page-shell page-shell-wide`}>
      <section className={styles.topSection}>
        <div className={styles.pageIntroRow}>
          <Link className="round-icon-link" to="/" aria-label={t('Back to home')}>
            <ArrowLeft size={16} />
          </Link>
          <PageIntro
            eyebrow={t('Statistics')}
            title={t('Player statistics')}
          />
        </div>

        {statistics ? (
          <div className={styles.overviewGrid}>
            {overviewItems.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className={styles.overviewCard}>
                  <div className={styles.overviewCardHeader}>
                    <span className={styles.overviewIcon}>
                      <Icon size={18} />
                    </span>
                    <p className={styles.overviewLabel}>{item.title}</p>
                  </div>
                  {'inlineValue' in item && item.inlineValue && 'suffix' in item && item.suffix ? (
                    <div className={styles.overviewInlineValueRow}>
                      <strong className={styles.overviewValue}>{item.value}</strong>
                      <p className={styles.overviewDetail}>{item.suffix}</p>
                    </div>
                  ) : (
                    <>
                      <strong className={styles.overviewValue}>{item.value}</strong>
                      {'suffix' in item && item.suffix ? (
                        <p className={styles.overviewDetail}>{item.suffix}</p>
                      ) : null}
                    </>
                  )}
                </article>
              )
            })}
          </div>
        ) : null}
      </section>

      {!statistics ? (
        <section className={`${styles.loadingPanel} panel-surface`}>
          <p className={styles.loadingMessage}>{t('Loading statistics...')}</p>
        </section>
      ) : null}

      {statistics ? (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <h2>{t('Performance breakdown by difficulty:')}</h2>
          </div>

          <div className={styles.difficultyGrid}>
            {statistics.byDifficulty.map((difficultyStatistics) => (
              <article
                key={difficultyStatistics.difficulty}
                className={`${styles.difficultyCard} ${difficultyCardClassNames[difficultyStatistics.difficulty]} panel-surface`}
              >
                <div className={styles.difficultyCardTop}>
                  <div className={styles.inlinePair}>
                    <p className={styles.difficultyLabel}>{t('Difficulty')}</p>
                    <p className={styles.difficultyTitleInline}>
                      {getDifficultyLabel(t, difficultyStatistics.difficulty)}
                    </p>
                  </div>
                  <div className={styles.inlinePair}>
                    <p className={styles.completedInline}>{t('Completed levels')}</p>
                    <strong className={styles.completedInlineValue}>
                      {difficultyStatistics.completedLevels}
                    </strong>
                  </div>
                </div>

                <div className={styles.metricStack}>
                  <div className={styles.metricSplitRow}>
                    <div className={styles.metricBlock}>
                      <p className={styles.metricLabel}>{t('Fastest level')}</p>
                      <strong className={styles.metricValue}>
                        {isTakeYourTimeEnabled
                          ? t('Hidden')
                          : formatFastestLevel(difficultyStatistics.fastestLevel, t)}
                      </strong>
                    </div>

                    <div className={styles.metricBlock}>
                      <p className={styles.metricLabel}>{t('Average per level')}</p>
                      <strong className={styles.metricValue}>
                        {isTakeYourTimeEnabled
                          ? t('Hidden')
                          : formatElapsedTime(difficultyStatistics.averageTimeSeconds)}
                      </strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
