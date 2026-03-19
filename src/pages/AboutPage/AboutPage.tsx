import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EditableContentPanel } from '../../components/EditableContentPanel'
import { PageIntro } from '../../components/PageIntro'
import styles from './AboutPage.module.css'

export function AboutPage() {
  return (
    <div className={`${styles.simplePage} page-shell`}>
      <div className={styles.pageIntroRow}>
        <Link className="round-icon-link" to="/" aria-label="Back to home">
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          eyebrow="About"
          title="About the game"
        />
      </div>
      <EditableContentPanel contentKey="about" />
    </div>
  )
}
