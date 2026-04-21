import { Clock3, Flag, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useRole } from '../../app/role'
import { StatCard } from '../../components/StatCard'
import { PageHeader, Panel } from '../../components/ui'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getPlayerStatistics } from '../../game/storage/statisticsStorage'
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
  const { isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
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
        inlineDetail: true,
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
        <PageHeader
          backTo="/"
          backLabel={t('Back to home')}
          eyebrow={t(' ')}
          title={t('Player statistics')}
        />

        <div className={styles.overviewGrid}>
          {statistics
            ? overviewItems.map((item) => (
                <StatCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  detail={'suffix' in item ? item.suffix : undefined}
                  inlineDetail={'inlineDetail' in item ? item.inlineDetail : false}
                />
              ))
            : Array.from({ length: 4 }, (_, index) => (
                <Panel key={`overview-skeleton-${index}`} className={styles.overviewSkeleton}>
                  <span aria-hidden="true" />
                </Panel>
              ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeading}>
          <h2>{t('Performance breakdown by difficulty:')}</h2>
        </div>

        <div className={styles.difficultyGrid}>
          {statistics
            ? statistics.byDifficulty.map((difficultyStatistics) => (
                <Panel
                  key={difficultyStatistics.difficulty}
                  as="article"
                  className={`${styles.difficultyCard} ${difficultyCardClassNames[difficultyStatistics.difficulty]}`}
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
                </Panel>
              ))
            : Array.from({ length: 4 }, (_, index) => (
                <Panel key={`difficulty-skeleton-${index}`} className={styles.difficultySkeleton}>
                  <span aria-hidden="true" />
                </Panel>
              ))}
        </div>
      </section>
    </div>
  )
}
