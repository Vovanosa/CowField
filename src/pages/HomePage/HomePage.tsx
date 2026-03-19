import { BarChart3, BookOpenText, Play, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import styles from './HomePage.module.css'

export function HomePage() {
  const { t } = useTranslation()
  const menuItems = [
    {
      to: '/levels',
      label: t('home.play'),
      icon: Play,
      variant: 'primary',
    },
    {
      to: '/about',
      label: t('home.about'),
      icon: BookOpenText,
      variant: 'secondary',
    },
    {
      to: '/statistics',
      label: t('home.statistics'),
      icon: BarChart3,
      variant: 'secondary',
    },
    {
      to: '/settings',
      label: t('home.settings'),
      icon: Settings,
      variant: 'secondary',
    },
  ] as const

  return (
    <div className={`${styles.homePage} page-shell page-shell-compact`}>
      <section className={styles.homeShell}>
        <div className={styles.homeWordmark}>
          <p className={styles.homeTitle}>{t('common.appName')}</p>
        </div>

        <nav className={styles.homeMenu} aria-label={t('home.menuLabel')}>
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                className={
                  item.variant === 'primary'
                    ? `${styles.homeMenuButton} ${styles.homeMenuButtonPrimary}`
                    : `${styles.homeMenuButton} ${styles.homeMenuButtonSecondary}`
                }
                to={item.to}
              >
                <span className={styles.homeMenuIcon}>
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </section>
    </div>
  )
}
