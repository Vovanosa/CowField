import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../app/useAuth'
import './ProfileMenu.css'

export function ProfileMenu() {
  const { t } = useTranslation()
  const { session, canPreviewUser, previewRole, setPreviewRole, logout, isGuest } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  if (!session) {
    return null
  }

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className="profile-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('Profile')}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="profile-trigger-icon">
          <UserRound size={16} />
        </span>
        <span className="profile-trigger-text">{isGuest ? t('Guest') : session.displayName}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen ? (
        <div className="profile-dropdown panel-surface" role="menu" aria-label={t('Profile')}>
          <div className="profile-summary">
            <p className="profile-name">{isGuest ? t('Guest') : session.displayName}</p>
            <p className="profile-meta">{session.email ?? t('You are playing as a Guest.')}</p>
          </div>

          {canPreviewUser ? (
            <label className="profile-field">
              <span>{t('Preview role')}</span>
              <select
                className="form-control"
                value={previewRole}
                onChange={(event) => setPreviewRole(event.target.value as 'admin' | 'user')}
              >
                <option value="admin">{t('Admin')}</option>
                <option value="user">{t('User')}</option>
              </select>
            </label>
          ) : null}

          <button
            type="button"
            className="secondary-button profile-logout-button"
            onClick={() => void logout()}
          >
            <LogOut size={16} />
            {t('Log out')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
