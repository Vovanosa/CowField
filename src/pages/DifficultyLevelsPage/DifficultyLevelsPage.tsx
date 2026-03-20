import { ArrowLeft, Lock, Plus, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { PageIntro } from '../../components/PageIntro'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getUnlockedLevelNumbers } from '../../game/progression'
import { getLevelsByDifficulty, getProgressByDifficulty } from '../../game/storage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import type { Difficulty, LevelDefinition, LevelProgress } from '../../game/types'
import './DifficultyLevelsPage.css'

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

function DifficultyLevelsPageScreen() {
  const { difficulty } = useParams()
  const [levels, setLevels] = useState<LevelDefinition[]>([])
  const [progressByLevelNumber, setProgressByLevelNumber] = useState<Record<number, LevelProgress>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { isAdmin } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = settings?.takeYourTimeEnabled === true
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
      <div className="difficulty-page page-shell">
        <PageIntro
          eyebrow="Levels"
          title={t('Unknown difficulty.')}
          description={t('Choose one of the available difficulty groups to browse levels.')}
        />
      </div>
    )
  }

  const unlockedLevelNumbers = getUnlockedLevelNumbers(levels, progressByLevelNumber)

  return (
    <div className="difficulty-page page-shell">
      <div className="difficulty-page-intro-row">
        <Link className="round-icon-link" to="/levels" aria-label={t('Back to all difficulties')}>
          <ArrowLeft size={16} />
        </Link>

        <PageIntro
          eyebrow={t('Levels')}
          title={t('{{difficulty}} Levels', { difficulty: getDifficultyLabel(t, difficulty) })}
        />
      </div>

      <section className="difficulty-levels-grid">
        {isLoading ? <p className="difficulty-level-loading">{t('Loading levels...')}</p> : null}
        {levels.map((level) => (
          <article
            key={level.id}
            className={
              unlockedLevelNumbers.has(level.levelNumber) || isAdmin
                ? 'difficulty-level-card panel-surface'
                : 'difficulty-level-card difficulty-level-card-locked panel-surface'
            }
          >
            {unlockedLevelNumbers.has(level.levelNumber) || isAdmin ? (
              <Link
                className="difficulty-level-link"
                to={`/game/${level.difficulty}/${level.levelNumber}`}
                aria-label={t('Open level {{levelNumber}}', { levelNumber: level.levelNumber })}
              />
            ) : null}
            <div className="difficulty-level-summary">
              <span className="difficulty-level-number">{level.levelNumber}</span>
              {!isTakeYourTimeEnabled ? (
                <span className="difficulty-level-time">
                  {formatElapsedTime(progressByLevelNumber[level.levelNumber]?.bestTimeSeconds ?? null)}
                </span>
              ) : null}
            </div>
            {!unlockedLevelNumbers.has(level.levelNumber) && !isAdmin ? (
              <div className="difficulty-level-lock" aria-hidden="true">
                <Lock size={16} />
              </div>
            ) : null}
            {isAdmin ? (
              <div className="difficulty-level-actions">
                <Link
                  className="difficulty-level-edit"
                  to={`/levels/${level.difficulty}/${level.levelNumber}/edit`}
                  aria-label={t('Edit level {{levelNumber}}', { levelNumber: level.levelNumber })}
                >
                  <SquarePen size={16} />
                </Link>
              </div>
            ) : null}
          </article>
        ))}

        {isAdmin ? (
          <Link className="difficulty-create-card panel-surface" to={`/levels/${difficulty}/create`}>
            <Plus size={42} strokeWidth={2.2} />
          </Link>
        ) : null}
      </section>
    </div>
  )
}

export function DifficultyLevelsPage() {
  const { difficulty } = useParams()

  return <DifficultyLevelsPageScreen key={difficulty ?? 'unknown'} />
}
