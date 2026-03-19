import { Grid3X3, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useRole } from '../../app/role'
import './AppHeader.css'

const navigationLinks = [
  { to: '/', label: 'Home' },
  { to: '/levels', label: 'Levels' },
  { to: '/statistics', label: 'Statistics' },
  { to: '/about', label: 'About' },
]

export function AppHeader() {
  const { isAdmin } = useRole()

  return (
    <header className="app-header">
      <div className="header-left">
        <NavLink className="brand-link" to="/">
          <span className="brand-mark" aria-hidden="true">
            <Grid3X3 size={18} />
          </span>
          <span className="brand-copy">
            <strong>Bullpen</strong>
            <span>{isAdmin ? 'Admin view' : ''}</span>
          </span>
        </NavLink>
      </div>

      <nav className="top-nav" aria-label="Primary">
        {navigationLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
            end={link.to === '/'}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        aria-label="Open settings"
        className={({ isActive }) =>
          isActive ? 'icon-link icon-link-active' : 'icon-link'
        }
      >
        <Settings size={18} />
      </NavLink>
    </header>
  )
}
