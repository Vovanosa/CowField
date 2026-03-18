import { Link } from 'react-router-dom'

import { useRole } from '../../app/role'
import { PageIntro } from '../../components/PageIntro'
import { DIFFICULTIES } from '../../game/storage'
import type { Difficulty } from '../../game/types'
import './LevelsPage.css'

const difficultyLabels: Record<Difficulty, string> = {
  light: 'Light',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const difficultyChipClassNames: Record<Difficulty, string> = {
  light: 'difficulty-link-chip difficulty-link-chip-light',
  easy: 'difficulty-link-chip difficulty-link-chip-easy',
  medium: 'difficulty-link-chip difficulty-link-chip-medium',
  hard: 'difficulty-link-chip',
}

export function LevelsPage() {
  const { isAdmin } = useRole()

  return (
    <div className='levels-page'>
      <PageIntro
        eyebrow="Level Select"
        title={isAdmin ? 'Choose a difficulty.' : 'Choose a difficulty to play.'}
        description={
          isAdmin
            ? 'Each difficulty has its own sequence of levels and its own create flow.'
            : 'Each difficulty has its own level list.'
        }
      />

      <section className="levels-grid" aria-label="Available levels">
        {DIFFICULTIES.map((difficulty) => (
          <Link
            key={difficulty}
            className={difficultyChipClassNames[difficulty]}
            to={`/levels/${difficulty}`}
          >
            <span className="difficulty-link-label">{difficultyLabels[difficulty]}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
