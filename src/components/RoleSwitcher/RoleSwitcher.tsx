import { useRole } from '../../app/role'
import './RoleSwitcher.css'

export function RoleSwitcher() {
  const { role, setRole } = useRole()

  return (
    <aside className="role-switcher-panel" aria-label="Role selector">
      <label className="role-switcher">
        <span>Role</span>
        <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
          <option value="player">Player</option>
          <option value="admin">Admin</option>
        </select>
      </label>
    </aside>
  )
}
