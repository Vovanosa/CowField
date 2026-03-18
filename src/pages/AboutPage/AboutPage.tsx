import { EditableContentPanel } from '../../components/EditableContentPanel'
import { PageIntro } from '../../components/PageIntro'
import './AboutPage.css'

export function AboutPage() {
  return (
    <div className="simple-page">
      <PageIntro
        eyebrow="About"
        title="About the game"
      />
      <EditableContentPanel contentKey="about" />
    </div>
  )
}
