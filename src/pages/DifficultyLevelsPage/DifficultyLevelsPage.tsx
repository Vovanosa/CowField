import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { LevelCard } from '../../components/LevelCard'
import { PageHeader, StatusMessage } from '../../components/ui'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getUnlockedLevelNumbers } from '../../game/progression'
import { getLevelsByDifficulty } from '../../game/storage/levelStorage'
import { getProgressByDifficulty } from '../../game/storage/progressStorage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import type { Difficulty, LevelProgress, LevelSummary } from '../../game/types'
import styles from './DifficultyLevelsPage.module.css'

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

function DifficultyLevelsPageScreen() {
  const { difficulty } = useParams()
  const [levels, setLevels] = useState<LevelSummary[]>([])
  const [progressByLevelNumber, setProgressByLevelNumber] = useState<Record<number, LevelProgress>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { isAdmin, isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
  const { t } = useTranslation()

  useEffect(() => {
    if (!isDifficulty(difficulty)) {
      return
    }

    const difficultyKey = difficulty
    let isActive = true

    async function loadLevels() {
      const [nextLevels, nextProgress] = await Promise.all([
        getLevelsByDifficulty(difficultyKey),
        getProgressByDifficulty(difficultyKey),
      ])

      if (!isActive) {
        return
      }

      setLevels(nextLevels)
      setProgressByLevelNumber(
        nextProgress.reduce<Record<number, LevelProgress>>((allProgress, progress) => {
          allProgress[progress.levelNumber] = progress
          return allProgress
        }, {}),
      )
      setIsLoading(false)
    }

    void loadLevels()

    return () => {
      isActive = false
    }
  }, [difficulty])

  if (!isDifficulty(difficulty)) {
    return (
      <div className={[styles.page, 'page-shell'].join(' ')}>
        <PageHeader
          eyebrow="Levels"
          title={t('Unknown difficulty.')}
          description={t('Choose one of the available difficulty groups to browse levels.')}
        />
      </div>
    )
  }

  const unlockedLevelNumbers = getUnlockedLevelNumbers(levels, progressByLevelNumber)

  return (
    <div className={[styles.page, 'page-shell'].join(' ')}>
      <PageHeader
        backTo="/levels"
        backLabel={t('Back to all difficulties')}
        eyebrow={t('Levels')}
        title={t('{{difficulty}} Levels', { difficulty: getDifficultyLabel(t, difficulty) })}
      />

      <section className={styles.levelsGrid}>
        {isLoading ? <StatusMessage message={t('Loading levels...')} compact /> : null}
        {levels.map((level) => (
          <LevelCard
            key={level.id}
            levelNumber={level.levelNumber}
            bestTime={
              !isTakeYourTimeEnabled
                ? formatElapsedTime(progressByLevelNumber[level.levelNumber]?.bestTimeSeconds ?? null)
                : null
            }
            isLocked={!unlockedLevelNumbers.has(level.levelNumber) && !isAdmin}
            openTo={`/game/${level.difficulty}/${level.levelNumber}`}
            openLabel={t('Open level {{levelNumber}}', { levelNumber: level.levelNumber })}
            editTo={
              isAdmin ? `/levels/${level.difficulty}/${level.levelNumber}/edit` : undefined
            }
            editLabel={
              isAdmin
                ? t('Edit level {{levelNumber}}', { levelNumber: level.levelNumber })
                : undefined
            }
          />
        ))}

        {isAdmin ? (
          <LevelCard
            createTo={`/levels/${difficulty}/create`}
            createLabel={t('Create level')}
          />
        ) : null}
      </section>
    </div>
  )
}

export function DifficultyLevelsPage() {
  const { difficulty } = useParams()

  return <DifficultyLevelsPageScreen key={difficulty ?? 'unknown'} />
}
