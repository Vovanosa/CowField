import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { setStoredSessionToken } from '../../game/storage'
import styles from '../AuthPage/AuthPage.module.css'

export function GoogleAuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (token) {
      setStoredSessionToken(token)
      window.location.replace('/')
      return
    }

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    navigate('/login?error=Google%20login%20failed.', { replace: true })
  }, [navigate, searchParams])

  return (
    <div className={styles.authPage}>
      <section className={`${styles.authPanel} panel-surface`}>
        <div className={styles.authHeader}>
          <p className={styles.authEyebrow}>{t('Login')}</p>
          <h1 className={styles.authTitle}>{t('Bullpen')}</h1>
          <p className={styles.authDescription}>{t('Completing Google login...')}</p>
        </div>
      </section>
    </div>
  )
}
