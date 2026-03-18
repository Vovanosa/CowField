import { ArrowRight, LockKeyhole, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageIntro } from '../components/PageIntro'
import './LevelsPage.css'

const levels = [
  { id: 1, status: 'available', time: null },
  { id: 2, status: 'locked', time: null },
  { id: 3, status: 'locked', time: null },
  { id: 4, status: 'locked', time: null },
  { id: 5, status: 'locked', time: null },
  { id: 6, status: 'locked', time: null },
] as const

export function LevelsPage() {
  return (
    <div>
      <PageIntro
        eyebrow="Level Select"
        title="The first pack will unlock one board at a time."
        description="This is placeholder progression UI for now. The next implementation step is to connect it to real level data and local save state."
      />

      <section className="levels-grid" aria-label="Available levels">
        {levels.map((level) => {
          const isLocked = level.status === 'locked'

          return (
            <article
              key={level.id}
              className={isLocked ? 'level-card level-card-locked' : 'level-card'}
            >
              <div className="level-card-top">
                <span className="level-label">Level {level.id}</span>
                {isLocked ? <LockKeyhole size={16} /> : <Trophy size={16} />}
              </div>
              <p className="level-card-copy">
                {isLocked
                  ? 'Unlock by completing the previous puzzle.'
                  : 'Ready for the first playable board implementation.'}
              </p>
              {isLocked ? (
                <span className="level-card-meta">Locked</span>
              ) : (
                <Link className="text-link" to="/game/1">
                  Open board
                  <ArrowRight size={16} />
                </Link>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}
