import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../app/useAuth'
import { Button, ControlButton, DropdownMenu, DropdownMenuItem, Panel, useDropdownMenu } from '../ui'
import styles from './ProfileMenu.module.css'

export function ProfileMenu() {
  const { t } = useTranslation()
  const { session, canPreviewUser, previewRole, setPreviewRole, logout, isGuest } = useAuth()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isPreviewRoleOpen, setIsPreviewRoleOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const previewRoleMenuRef = useRef<HTMLDivElement | null>(null)

  const closeProfileMenu = useCallback(() => {
    setIsProfileMenuOpen(false)
  }, [])

  const closePreviewRoleMenu = useCallback(() => {
    setIsPreviewRoleOpen(false)
  }, [])

  useDropdownMenu({
    containerRef: profileMenuRef,
    isOpen: isProfileMenuOpen,
    onClose: closeProfileMenu,
  })
  useDropdownMenu({
    containerRef: previewRoleMenuRef,
    isOpen: isPreviewRoleOpen,
    onClose: closePreviewRoleMenu,
  })

  useEffect(() => {
    if (!isProfileMenuOpen) {
      closePreviewRoleMenu()
    }
  }, [closePreviewRoleMenu, isProfileMenuOpen])

  if (!session) {
    return null
  }

  return (
    <div className={styles.profileMenu} ref={profileMenuRef}>
      <button
        type="button"
        className={styles.profileTrigger}
        aria-haspopup="menu"
        aria-expanded={isProfileMenuOpen}
        aria-label={t('Profile')}
        onClick={() => {
          if (isProfileMenuOpen) {
            closePreviewRoleMenu()
          }

          setIsProfileMenuOpen((current) => !current)
        }}
      >
        <span className={styles.profileTriggerIcon}>
          <UserRound size={16} />
        </span>
        <span className={styles.profileTriggerText}>{isGuest ? t('Guest') : session.displayName}</span>
        <ChevronDown size={14} />
      </button>

      {isProfileMenuOpen ? (
        <Panel className={styles.profileDropdown} role="menu" aria-label={t('Profile')}>
          <div className={styles.profileSummary}>
            <p className={styles.profileName}>{isGuest ? t('Guest') : session.displayName}</p>
            <p className={styles.profileMeta}>{session.email ?? t('You are playing as a Guest.')}</p>
          </div>

          {canPreviewUser ? (
            <label className={styles.profileField}>
              <span>{t('Preview role')}</span>
              <div className={styles.profileSelect} ref={previewRoleMenuRef}>
                <ControlButton
                  className={styles.profileSelectTrigger}
                  fullWidth
                  aria-haspopup="listbox"
                  aria-expanded={isPreviewRoleOpen}
                  onClick={() => setIsPreviewRoleOpen((current) => !current)}
                >
                  <span>{previewRole === 'admin' ? t('Admin') : t('User')}</span>
                  <ChevronDown
                    size={16}
                    className={
                      isPreviewRoleOpen
                        ? `${styles.profileSelectChevron} ${styles.profileSelectChevronOpen}`
                        : styles.profileSelectChevron
                    }
                  />
                </ControlButton>

                {isPreviewRoleOpen ? (
                  <DropdownMenu
                    className={styles.profileSelectMenu}
                    role="listbox"
                    label={t('Preview role')}
                  >
                    {(['admin', 'user'] as const).map((role) => (
                      <DropdownMenuItem
                        key={role}
                        className={styles.profileSelectOption}
                        active={previewRole === role}
                        role="option"
                        aria-selected={previewRole === role}
                        onClick={() => {
                          setPreviewRole(role)
                          closePreviewRoleMenu()
                        }}
                      >
                        {role === 'admin' ? t('Admin') : t('User')}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenu>
                ) : null}
              </div>
            </label>
          ) : null}

          <Button
            className={styles.profileLogoutButton}
            onClick={() => void logout()}
            leadingIcon={<LogOut size={16} />}
          >
            {t('Log out')}
          </Button>
        </Panel>
      ) : null}
    </div>
  )
}
