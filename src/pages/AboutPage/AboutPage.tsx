import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { EditableContentPanel } from '../../components/EditableContentPanel'
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
      <EditableContentPanel contentKey="about" />
    </div>
  )
}
