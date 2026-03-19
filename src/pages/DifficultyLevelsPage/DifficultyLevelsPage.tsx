import { ArrowLeft, Lock, Plus, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { PageIntro } from '../../components/PageIntro'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getUnlockedLevelNumbers } from '../../game/progression'
import { getLevelsByDifficulty, getProgressByDifficulty } from '../../game/storage'
import type { Difficulty, LevelDefinition, LevelProgress } from '../../game/types'
import './DifficultyLevelsPage.css'

const difficultyLabels: Record<Difficulty, string> = {
  light: 'Light',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

function DifficultyLevelsPageScreen() {
  const { difficulty } = useParams()
  const [levels, setLevels] = useState<LevelDefinition[]>([])
  const [progressByLevelNumber, setProgressByLevelNumber] = useState<Record<number, LevelProgress>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { isAdmin } = useRole()

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
      <div className="difficulty-page">
        <PageIntro
          eyebrow="Levels"
          title="Unknown difficulty."
          description="Choose one of the available difficulty groups to browse levels."
        />
      </div>
    )
  }

  const unlockedLevelNumbers = getUnlockedLevelNumbers(levels, progressByLevelNumber)

  return (
    <div className="difficulty-page">
      <div className="difficulty-page-intro-row">
        <Link className="round-icon-link" to="/levels" aria-label="Back to all difficulties">
          <ArrowLeft size={16} />
        </Link>

        <PageIntro
          eyebrow="Levels"
          title={`${difficultyLabels[difficulty]} Levels`}
        />
      </div>

      <section className="difficulty-levels-grid">
        {isLoading ? <p className="difficulty-level-loading">Loading levels...</p> : null}
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
                aria-label={`Open level ${level.levelNumber}`}
              />
            ) : null}
            <div className="difficulty-level-summary">
              <span className="difficulty-level-number">{level.levelNumber}</span>
              <span className="difficulty-level-time">
                {formatElapsedTime(progressByLevelNumber[level.levelNumber]?.bestTimeSeconds ?? null)}
              </span>
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
                  aria-label={`Edit level ${level.levelNumber}`}
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
