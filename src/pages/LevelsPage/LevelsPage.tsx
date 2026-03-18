import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

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

export function LevelsPage() {
  return (
    <div>
      <PageIntro
        eyebrow="Level Select"
        title="Choose a difficulty."
        description="Each difficulty has its own sequence of levels and its own create flow."
      />

      <section className="levels-grid" aria-label="Available levels">
        {DIFFICULTIES.map((difficulty) => (
          <Link key={difficulty} className="level-card difficulty-link-card" to={`/levels/${difficulty}`}>
            <div className="level-card-top">
              <span className="level-label">{difficultyLabels[difficulty]}</span>
              <ChevronRight size={18} />
            </div>
            <p className="level-card-copy">
              Open the {difficultyLabels[difficulty].toLowerCase()} level list.
            </p>
          </Link>
        ))}
      </section>
    </div>
  )
}
