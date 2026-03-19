import { ArrowLeft, Clock3, Flag, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageIntro } from '../../components/PageIntro'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getPlayerStatistics } from '../../game/storage'
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

    return [
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

  const mostCompletedDifficulty = useMemo(() => {
    if (!statistics) {
      return null
    }

    return statistics.byDifficulty.reduce<PlayerStatisticsSummary['byDifficulty'][number] | null>(
      (currentLeader, difficultyStats) => {
        if (currentLeader === null || difficultyStats.completedLevels > currentLeader.completedLevels) {
          return difficultyStats
        }

        return currentLeader
      },
      null,
    )
  }, [statistics])

  return (
    <div className={`${styles.statisticsPage} page-shell page-shell-wide`}>
      <section className={`${styles.heroPanel} panel-surface`}>
        <div className={styles.heroTopRow}>
          <div className={styles.pageIntroRow}>
            <Link className="round-icon-link" to="/" aria-label="Back to home">
              <ArrowLeft size={16} />
            </Link>
            <PageIntro
              eyebrow="Statistics"
              title="Player statistics"
              description="A backend-calculated overview of your completed levels, placement habits, and pace across every difficulty."
            />
          </div>

          {statistics ? (
            <aside className={styles.progressFeature}>
              <p className={styles.progressFeatureLabel}>Most progress</p>
              <strong className={styles.progressFeatureValue}>
                {mostCompletedDifficulty
                  ? difficultyLabels[mostCompletedDifficulty.difficulty]
                  : 'No data'}
              </strong>
              <p className={styles.progressFeatureDetail}>
                {mostCompletedDifficulty
                  ? `${mostCompletedDifficulty.completedLevels} completed levels`
                  : 'Finish a level to start building statistics.'}
              </p>
            </aside>
          ) : null}
        </div>

        {statistics ? (
          <div className={styles.overviewRail}>
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
                  <strong className={styles.overviewValue}>{item.value}</strong>
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
            <p className={styles.sectionEyebrow}>Performance breakdown</p>
            <h2>By difficulty</h2>
            <p className={styles.sectionDescription}>
              Each card groups completion count, fastest solved level, and average completion pace
              for one difficulty.
            </p>
          </div>

          <div className={styles.difficultyGrid}>
            {statistics.byDifficulty.map((difficultyStatistics) => (
              <article
                key={difficultyStatistics.difficulty}
                className={`${styles.difficultyCard} ${difficultyCardClassNames[difficultyStatistics.difficulty]} panel-surface`}
              >
                <div className={styles.difficultyCardTop}>
                  <div>
                    <p className={styles.difficultyEyebrow}>Difficulty</p>
                    <h3 className={styles.difficultyTitle}>
                      {difficultyLabels[difficultyStatistics.difficulty]}
                    </h3>
                  </div>
                </div>

                <div className={styles.metricStack}>
                  <div className={styles.metricBlock}>
                    <p className={styles.metricLabel}>Completed levels</p>
                    <strong className={styles.metricPrimaryValue}>
                      {difficultyStatistics.completedLevels}
                    </strong>
                  </div>

                  <div className={styles.metricSplitRow}>
                    <div className={styles.metricBlock}>
                      <p className={styles.metricLabel}>Fastest level</p>
                      <strong className={styles.metricValue}>
                        {formatFastestLevel(difficultyStatistics.fastestLevel)}
                      </strong>
                    </div>

                    <div className={styles.metricBlock}>
                      <p className={styles.metricLabel}>Average per level</p>
                      <strong className={styles.metricValue}>
                        {formatElapsedTime(difficultyStatistics.averageTimeSeconds)}
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
