import { BarChart3, BookOpenText, Play, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useGuestStatisticsToast } from '../../app/useGuestStatisticsToast'
import { useAuth } from '../../app/useAuth'
import { Toast } from '../../components/ui'
import styles from './HomePage.module.css'

type HomeMenuItem = {
  to: string
  label: string
  icon: typeof Play
  variant: 'primary' | 'secondary'
  disabled?: boolean
}

export function HomePage() {
  const { t } = useTranslation()
  const { isGuest } = useAuth()
  const { toastMessage, showToast } = useGuestStatisticsToast()
  const menuItems: HomeMenuItem[] = [
    {
      to: '/levels',
      label: t('Play'),
      icon: Play,
      variant: 'primary',
    },
    {
      to: '/about',
      label: t('About'),
      icon: BookOpenText,
      variant: 'secondary',
    },
    {
      to: '/statistics',
      label: t('Statistics'),
      icon: BarChart3,
      variant: 'secondary',
      disabled: isGuest,
    },
    {
      to: '/settings',
      label: t('Settings'),
      icon: Settings,
      variant: 'secondary',
    },
  ]

  return (
    <div className={`${styles.homePage} page-shell page-shell-compact`}>
      <section className={styles.homeShell}>
        <div className={styles.homeWordmark}>
          <p className={styles.homeTitle}>{t('Bullpen')}</p>
        </div>

        <nav className={styles.homeMenu} aria-label={t('Home menu')}>
          {menuItems.map((item) => {
            const Icon = item.icon

            const className =
              item.variant === 'primary'
                ? `${styles.homeMenuButton} ${styles.homeMenuButtonPrimary}`
                : `${styles.homeMenuButton} ${styles.homeMenuButtonSecondary}`

            return item.disabled ? (
              <button
                key={item.to}
                type="button"
                className={`${className} ${styles.homeMenuButtonDisabled}`}
                aria-disabled="true"
                onClick={showToast}
              >
                <span className={styles.homeMenuIcon}>
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </button>
            ) : (
              <Link key={item.to} className={className} to={item.to}>
                <span className={styles.homeMenuIcon}>
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {toastMessage ? (
          <Toast title={toastMessage} />
        ) : null}
      </section>
    </div>
  )
}
