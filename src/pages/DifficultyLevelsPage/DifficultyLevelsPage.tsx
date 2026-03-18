import { ArrowLeft, Eye, SquarePen } from 'lucide-react'
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
      <div>
        <PageIntro
          eyebrow="Levels"
          title="Unknown difficulty."
          description="Choose one of the available difficulty groups to browse levels."
        />
      </div>
    )
  }

  return (
    <div>
      <Link className="difficulty-back-link" to="/levels" aria-label="Back to all difficulties">
        <ArrowLeft size={16} />
      </Link>

      <PageIntro
        eyebrow="Levels"
        title={`${difficultyLabels[difficulty]} Levels`}
        description={
          isAdmin
            ? 'Browse the authored levels for this difficulty or create the next one in the sequence.'
            : 'Browse the available levels for this difficulty.'
        }
      />

      <section className="difficulty-levels-grid">
        {isLoading ? <p className="difficulty-level-copy">Loading levels...</p> : null}
        {levels.map((level) => (
          <article key={level.id} className="difficulty-level-card">
            <div className="difficulty-level-top">
              <span className="difficulty-level-label">Level {level.levelNumber}</span>
              <span className="difficulty-level-pill">{difficultyLabels[level.difficulty]}</span>
            </div>
            <p className="difficulty-level-copy">{level.title}</p>
            <div className="difficulty-level-actions">
              <Link className="text-link" to={`/game/${level.difficulty}/${level.levelNumber}`}>
                <Eye size={16} />
                Open board
              </Link>
              {isAdmin ? (
                <Link
                  className="text-link"
                  to={`/levels/${level.difficulty}/${level.levelNumber}/edit`}
                >
                  <SquarePen size={16} />
                  Edit level
                </Link>
              ) : null}
            </div>
          </article>
        ))}

        {isAdmin ? (
          <Link className="difficulty-create-card" to={`/levels/${difficulty}/create`}>
            <SquarePen size={20} />
            Create a level
          </Link>
        ) : null}
      </section>
    </div>
  )
}
