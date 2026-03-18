import { ArrowLeft, Plus, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { PageIntro } from '../../components/PageIntro'
import { getLevelsByDifficulty } from '../../game/storage'
import type { Difficulty, LevelDefinition } from '../../game/types'
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

export function DifficultyLevelsPage() {
  const { difficulty } = useParams()
  const [levels, setLevels] = useState<LevelDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAdmin } = useRole()

  useEffect(() => {
    if (!isDifficulty(difficulty)) {
      return
    }

    const difficultyKey = difficulty
    let isActive = true

    async function loadLevels() {
      const nextLevels = await getLevelsByDifficulty(difficultyKey)

      if (!isActive) {
        return
      }

      setLevels(nextLevels)
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

  return (
    <div className="difficulty-page">
      <Link className="round-icon-link" to="/levels" aria-label="Back to all difficulties">
        <ArrowLeft size={16} />
      </Link>

      <PageIntro
        eyebrow="Levels"
        title={`${difficultyLabels[difficulty]} Levels`}
      />

      <section className="difficulty-levels-grid">
        {isLoading ? <p className="difficulty-level-loading">Loading levels...</p> : null}
        {levels.map((level) => (
          <article key={level.id} className="difficulty-level-card panel-surface">
            <Link
              className="difficulty-level-link"
              to={`/game/${level.difficulty}/${level.levelNumber}`}
              aria-label={`Open level ${level.levelNumber}`}
            />
            <span className="difficulty-level-number">{level.levelNumber}</span>
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
