import { useTranslation } from 'react-i18next'

import { useRole } from '../../app/role'
import './RoleSwitcher.css'

export function RoleSwitcher() {
  const { role, setRole } = useRole()
  const { t } = useTranslation()

  return (
    <aside className="role-switcher-panel" aria-label={t('common.role')}>
      <label className="role-switcher">
        <span>{t('common.role')}</span>
        <select
          className="form-control"
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
        >
          <option value="player">{t('common.player')}</option>
          <option value="admin">{t('common.admin')}</option>
        </select>
      </label>
    </aside>
  )
}
