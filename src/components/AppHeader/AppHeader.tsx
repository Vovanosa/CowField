import { Grid3X3, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import './AppHeader.css'

const navigationLinks = [
  { to: '/', label: 'Home' },
  { to: '/levels', label: 'Levels' },
  { to: '/about', label: 'About' },
]

export function AppHeader() {
  return (
    <header className="app-header">
      <NavLink className="brand-link" to="/">
        <span className="brand-mark" aria-hidden="true">
          <Grid3X3 size={18} />
        </span>
        <span className="brand-copy">
          <strong>Bullpen</strong>
          <span>logic puzzle prototype</span>
        </span>
      </NavLink>

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
