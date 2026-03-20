import { useTranslation } from 'react-i18next'

import { useRole } from '../../app/role'
import './RoleSwitcher.css'

export function RoleSwitcher() {
  const { role, setRole } = useRole()
  const { t } = useTranslation()

  return (
    <aside className="role-switcher-panel" aria-label={t('Role')}>
      <label className="role-switcher">
        <span>{t('Role')}</span>
        <select
          className="form-control"
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
        >
          <option value="player">{t('Player')}</option>
          <option value="admin">{t('Admin')}</option>
        </select>
      </label>
    </aside>
  )
}
