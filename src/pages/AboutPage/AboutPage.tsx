import { EditableContentPanel } from '../../components/EditableContentPanel'
import { PageIntro } from '../../components/PageIntro'
import styles from './AboutPage.module.css'

export function AboutPage() {
  return (
    <div className={styles.simplePage}>
      <PageIntro
        eyebrow="About"
        title="About the game"
      />
      <EditableContentPanel contentKey="about" />
    </div>
  )
}
