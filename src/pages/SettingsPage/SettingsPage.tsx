import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EditableContentPanel } from '../../components/EditableContentPanel'
import { PageIntro } from '../../components/PageIntro'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  return (
    <div className={styles.simplePage}>
      <div className={styles.pageIntroRow}>
        <Link className="round-icon-link" to="/" aria-label="Back to home">
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          eyebrow="Settings"
          title="Settings will stay minimal in version one."
          description="There is no sound, account, or cloud sync in scope yet, so this page is just a placeholder for future preferences."
        />
      </div>
      <EditableContentPanel contentKey="settings" />
    </div>
  )
}
