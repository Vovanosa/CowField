import { BarChart3, BookOpenText, Play, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

import styles from './HomePage.module.css'

const menuItems = [
  {
    to: '/levels',
    label: 'Play',
    icon: Play,
    variant: 'primary',
  },
  {
    to: '/about',
    label: 'About',
    icon: BookOpenText,
    variant: 'secondary',
  },
  {
    to: '/statistics',
    label: 'Statistics',
    icon: BarChart3,
    variant: 'secondary',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    variant: 'secondary',
  },
] as const

export function HomePage() {
  return (
    <div className={`${styles.homePage} page-shell page-shell-compact`}>
      <section className={styles.homeShell}>
        <div className={styles.homeWordmark}>
          <p className={styles.homeTitle}>Bullpen</p>
        </div>

        <nav className={styles.homeMenu} aria-label="Home menu">
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
