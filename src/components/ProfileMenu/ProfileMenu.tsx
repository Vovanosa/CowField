import { BookOpenText, ChevronDown, LogOut, UserPlus, UserRound } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import { withReturnTo } from '../../app/returnTo'
import { useAuth } from '../../app/useAuth'
import { LanguageSwitcher } from '../LanguageSwitcher'
import {
  Button,
  ControlButton,
  DropdownMenu,
  DropdownMenuItem,
  Panel,
  TextLink,
  useDropdownMenu,
} from '../ui'
import styles from './ProfileMenu.module.css'

export function ProfileMenu() {
  const { t } = useTranslation()
  const { session, canPreviewUser, previewRole, setPreviewRole, logout, isGuest } = useAuth()
  const { pathname } = useLocation()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isPreviewRoleOpen, setIsPreviewRoleOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const previewRoleMenuRef = useRef<HTMLDivElement | null>(null)

  const closeProfileMenu = useCallback(() => {
    setIsProfileMenuOpen(false)
    setIsPreviewRoleOpen(false)
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
        {/*
          Both hidden below 640px, leaving the icon alone as a round button — see the media query in
          the stylesheet. The name and email are in the dropdown either way, and `aria-label` already
          names the trigger, so nothing is lost by dropping the visible text on a phone.
        */}
        <span className={styles.profileTriggerText}>{isGuest ? t('Guest') : session.displayName}</span>
        <ChevronDown size={14} className={styles.profileTriggerChevron} />
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

          {/*
            Theme and language, for the widths where the floating pills have stepped aside so they
            do not crowd the page title. The component decides nothing: it renders at every width and
            its own stylesheet hides whichever copy is not wanted, so there is no width hook here and
            no state to keep in step.
          */}
          <LanguageSwitcher variant="menu" />

          {/*
            The only route into the landing page from inside the app.

            `/` is the home menu once you are signed in, so the page that explains what CowField is
            had no link pointing at it from anywhere a player could stand — it existed only for
            visitors who had never signed in. `/welcome` renders it for everyone; see the route.

            It sits here rather than in the page navigation because it is not somewhere anyone goes
            twice, and this menu is already the shell's home for "about you and this app".
          */}
          <TextLink to="/welcome" className={styles.profileAbout} onClick={closeProfileMenu}>
            <BookOpenText size={16} />
            <span>{t('What is CowField?')}</span>
          </TextLink>

          {/*
            **A guest gets *Sign up*, and no *Log out* at all** (scope decision D8).

            Logging a guest out is the one action in this menu that can only destroy something. Their
            progress is local to this browser and there is no account to sign back into, so the
            button offered them a way to erase their times and nothing else — while the thing they
            actually want, keeping those times, had no entry point anywhere in the app.

            The accepted cost, chosen deliberately: a guest on a shared computer cannot clear
            themselves in one click. The way to a different account is *Sign up* → the register page
            → its sign-in link.

            `returnTo` carries the page they were on, so signing up from a level returns to that
            level rather than to the home screen.
          */}
          {isGuest ? (
            <Button
              className={styles.profileLogoutButton}
              variant="primary"
              to={withReturnTo('/register', pathname)}
              onClick={closeProfileMenu}
              leadingIcon={<UserPlus size={16} />}
            >
              {t('Sign up')}
            </Button>
          ) : (
            <Button
              className={styles.profileLogoutButton}
              onClick={() => void logout()}
              leadingIcon={<LogOut size={16} />}
            >
              {t('Log out')}
            </Button>
          )}
        </Panel>
      ) : null}
    </div>
  )
}
