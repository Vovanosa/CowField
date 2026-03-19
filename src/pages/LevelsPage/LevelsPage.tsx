import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useRole } from '../../app/role'
import { PageIntro } from '../../components/PageIntro'
import { DIFFICULTIES } from '../../game/storage'
import type { Difficulty } from '../../game/types'
import styles from './LevelsPage.module.css'

const difficultyChipClassNames: Record<Difficulty, string> = {
  light: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipLight}`,
  easy: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipEasy}`,
  medium: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipMedium}`,
  hard: styles.difficultyLinkChip,
}

export function LevelsPage() {
  const { isAdmin } = useRole()
  const { t } = useTranslation()

  return (
    <div className={`${styles.levelsPage} page-shell`}>
      <div className={styles.levelsIntroRow}>
        <Link className="round-icon-link" to="/" aria-label={t('common.backToHome')}>
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          eyebrow={t('levels.eyebrow')}
          title={isAdmin ? t('levels.titleAdmin') : t('levels.titlePlayer')}
          description={
            isAdmin
              ? t('levels.descriptionAdmin')
              : t('levels.descriptionPlayer')
          }
        />
      </div>

      <section className={styles.levelsGrid} aria-label={t('levels.availableLevels')}>
        {DIFFICULTIES.map((difficulty) => (
          <Link
            key={difficulty}
            className={difficultyChipClassNames[difficulty]}
            to={`/levels/${difficulty}`}
          >
            <span className={styles.difficultyLinkLabel}>{t(`difficulty.${difficulty}`)}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
