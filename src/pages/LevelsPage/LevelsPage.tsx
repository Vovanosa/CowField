import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useRole } from '../../app/role'
import { PageIntro } from '../../components/PageIntro'
import { DIFFICULTIES } from '../../game/storage'
import type { Difficulty } from '../../game/types'
import styles from './LevelsPage.module.css'

const difficultyLabels: Record<Difficulty, string> = {
  light: 'Light',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const difficultyChipClassNames: Record<Difficulty, string> = {
  light: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipLight}`,
  easy: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipEasy}`,
  medium: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipMedium}`,
  hard: styles.difficultyLinkChip,
}

export function LevelsPage() {
  const { isAdmin } = useRole()

  return (
    <div className={styles.levelsPage}>
      <div className={styles.levelsIntroRow}>
        <Link className="round-icon-link" to="/" aria-label="Back to home">
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          eyebrow="Level Select"
          title={isAdmin ? 'Choose a difficulty.' : 'Choose a difficulty to play.'}
          description={
            isAdmin
              ? 'Each difficulty has its own sequence of levels and its own create flow.'
              : 'Each difficulty has its own level list.'
          }
        />
      </div>

      <section className={styles.levelsGrid} aria-label="Available levels">
        {DIFFICULTIES.map((difficulty) => (
          <Link
            key={difficulty}
            className={difficultyChipClassNames[difficulty]}
            to={`/levels/${difficulty}`}
          >
            <span className={styles.difficultyLinkLabel}>{difficultyLabels[difficulty]}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
