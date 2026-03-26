import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { completeGoogleLogin } from '../../game/storage'
import styles from '../AuthPage/AuthPage.module.css'

export function GoogleAuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const sessionVerifier = searchParams.get('neon_auth_session_verifier')

    async function finishLogin() {
      if (error) {
        navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
        return
      }

      if (!code && !sessionVerifier) {
        navigate('/login?error=Google%20login%20failed.', { replace: true })
        return
      }

      try {
        await completeGoogleLogin(code ?? undefined)
        navigate('/', { replace: true })
      } catch (completionError) {
        const message =
          completionError instanceof Error
            ? completionError.message
            : 'Google login failed.'
        navigate(`/login?error=${encodeURIComponent(message)}`, { replace: true })
      }
    }

    void finishLogin()
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
