import { ArrowLeft, Clock3, Flag, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageIntro } from '../../components/PageIntro'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getPlayerStatistics } from '../../game/storage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import type { Difficulty, PlayerStatisticsSummary } from '../../game/types'
import styles from './StatisticsPage.module.css'

const difficultyLabels: Record<Difficulty, string> = {
  light: 'Light',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const difficultyCardClassNames: Record<Difficulty, string> = {
  light: styles.difficultyCardLight,
  easy: styles.difficultyCardEasy,
  medium: styles.difficultyCardMedium,
  hard: styles.difficultyCardHard,
}

function formatFastestLevel(
  fastestLevel: PlayerStatisticsSummary['byDifficulty'][number]['fastestLevel'],
) {
  if (!fastestLevel) {
    return 'No completed level'
  }

  return `Level ${fastestLevel.levelNumber} | ${formatElapsedTime(fastestLevel.timeSeconds)}`
}

export function StatisticsPage() {
  const [statistics, setStatistics] = useState<PlayerStatisticsSummary | null>(null)
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = settings?.takeYourTimeEnabled === true

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
        title: 'Most progress',
        value: leadingDifficulty.completedLevels > 0
          ? difficultyLabels[leadingDifficulty.difficulty]
          : 'No data',
        suffix: leadingDifficulty.completedLevels > 0
          ? `${leadingDifficulty.completedLevels} completed levels`
          : '',
        inlineValue: true,
        icon: Flag,
      },
      {
        title: 'Completed levels',
        value: String(statistics.totalCompletedLevels),
        icon: Flag,
      },
      {
        title: 'Placed bulls',
        value: String(statistics.totalBullPlacements),
        icon: Trophy,
      },
      {
        title: 'Total completion time',
        value: formatElapsedTime(statistics.totalCompletionTimeSeconds),
        icon: Clock3,
      },
    ]
  }, [statistics])

  return (
    <div className={`${styles.statisticsPage} page-shell page-shell-wide`}>
      <section className={styles.topSection}>
        <div className={styles.pageIntroRow}>
          <Link className="round-icon-link" to="/" aria-label="Back to home">
            <ArrowLeft size={16} />
          </Link>
          <PageIntro
            eyebrow="Statistics"
            title="Player statistics"
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
          <p className={styles.loadingMessage}>Loading statistics...</p>
        </section>
      ) : null}

      {statistics ? (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <h2>Performance breakdown by difficulty:</h2>
          </div>

          <div className={styles.difficultyGrid}>
            {statistics.byDifficulty.map((difficultyStatistics) => (
              <article
                key={difficultyStatistics.difficulty}
                className={`${styles.difficultyCard} ${difficultyCardClassNames[difficultyStatistics.difficulty]} panel-surface`}
              >
                <div className={styles.difficultyCardTop}>
                  <div className={styles.inlinePair}>
                    <p className={styles.difficultyLabel}>Difficulty</p>
                    <p className={styles.difficultyTitleInline}>
                      {difficultyLabels[difficultyStatistics.difficulty]}
                    </p>
                  </div>
                  <div className={styles.inlinePair}>
                    <p className={styles.completedInline}>Completed levels</p>
                    <strong className={styles.completedInlineValue}>
                      {difficultyStatistics.completedLevels}
                    </strong>
                  </div>
                </div>

                <div className={styles.metricStack}>
                  <div className={styles.metricSplitRow}>
                    <div className={styles.metricBlock}>
                      <p className={styles.metricLabel}>Fastest level</p>
                      <strong className={styles.metricValue}>
                        {isTakeYourTimeEnabled
                          ? 'Hidden'
                          : formatFastestLevel(difficultyStatistics.fastestLevel)}
                      </strong>
                    </div>

                    <div className={styles.metricBlock}>
                      <p className={styles.metricLabel}>Average per level</p>
                      <strong className={styles.metricValue}>
                        {isTakeYourTimeEnabled
                          ? 'Hidden'
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
