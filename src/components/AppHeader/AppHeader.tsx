import { Grid3X3, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { useRole } from '../../app/role'
import { useGuestStatisticsToast } from '../../app/useGuestStatisticsToast'
import './AppHeader.css'

const navigationLinks = [
  { to: '/', label: 'Home' },
  { to: '/levels', label: 'Levels' },
  { to: '/statistics', label: 'Statistics' },
  { to: '/about', label: 'About' },
]

export function AppHeader() {
  const { isAdmin, isGuest } = useRole()
  const { t } = useTranslation()
  const { toastMessage, showToast } = useGuestStatisticsToast()

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
        {navigationLinks.map((link) =>
          isGuest && link.to === '/statistics' ? (
            <button
              key={link.to}
              type="button"
              className="nav-link nav-link-disabled"
              aria-disabled="true"
              onClick={showToast}
            >
              {link.label}
            </button>
          ) : (
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
          ),
        )}
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

      {toastMessage ? (
        <div className="header-toast" role="status" aria-live="polite">
          {t('Statistics is available only for logged users.')}
        </div>
      ) : null}
    </header>
  )
}
