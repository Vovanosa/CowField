import { EditableContentPanel } from '../../components/EditableContentPanel'
import { PageIntro } from '../../components/PageIntro'
import './SettingsPage.css'

export function SettingsPage() {
  return (
    <div className="simple-page">
      <PageIntro
        eyebrow="Settings"
        title="Settings will stay minimal in version one."
        description="There is no sound, account, or cloud sync in scope yet, so this page is just a placeholder for future preferences."
      />
      <EditableContentPanel contentKey="settings" />
    </div>
  )
}
