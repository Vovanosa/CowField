import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../app/useAuth'
import './ProfileMenu.css'

export function ProfileMenu() {
  const { t } = useTranslation()
  const { session, canPreviewUser, previewRole, setPreviewRole, logout, isGuest } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isPreviewRoleOpen, setIsPreviewRoleOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setIsPreviewRoleOpen(false)
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
        onClick={() =>
          setIsOpen((current) => {
            const nextIsOpen = !current

            if (!nextIsOpen) {
              setIsPreviewRoleOpen(false)
            }

            return nextIsOpen
          })
        }
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
              <div className="profile-select">
                <button
                  type="button"
                  className="form-control profile-select-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isPreviewRoleOpen}
                  onClick={() => setIsPreviewRoleOpen((current) => !current)}
                >
                  <span>{previewRole === 'admin' ? t('Admin') : t('User')}</span>
                  <ChevronDown
                    size={16}
                    className={isPreviewRoleOpen ? 'profile-select-chevron profile-select-chevron-open' : 'profile-select-chevron'}
                  />
                </button>

                <div
                  className={isPreviewRoleOpen ? 'profile-select-menu profile-select-menu-open' : 'profile-select-menu'}
                  role="listbox"
                  aria-label={t('Preview role')}
                >
                  {(['admin', 'user'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={
                        previewRole === role
                          ? 'profile-select-option profile-select-option-active'
                          : 'profile-select-option'
                      }
                      role="option"
                      aria-selected={previewRole === role}
                      onClick={() => {
                        setPreviewRole(role)
                        setIsPreviewRoleOpen(false)
                      }}
                    >
                      {role === 'admin' ? t('Admin') : t('User')}
                    </button>
                  ))}
                </div>
              </div>
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
