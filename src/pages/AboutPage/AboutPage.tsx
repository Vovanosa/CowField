import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PageIntro } from '../../components/PageIntro'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className={`${styles.simplePage} page-shell`}>
      <div className={styles.pageIntroRow}>
        <Link className="round-icon-link" to="/" aria-label={t('Back to home')}>
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          title={t('About the game')}
        />
      </div>
      <section className={`${styles.aboutPanel} panel-surface`}>
        <p>
          {t(
            'Bullpen is a calm logic puzzle about placing bulls so every row, column, and colored pen matches its target while no bulls touch, even diagonally.',
          )}
        </p>
        <p>
          {t(
            'Use dots as optional notes, take your time, and work level by level through handcrafted boards designed for a steady, relaxed pace.',
          )}
        </p>
      </section>
    </div>
  )
}
