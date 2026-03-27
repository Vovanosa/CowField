import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { translateAuthMessage } from '../../app/translateAuthMessage'
import { AuthLayout } from '../../components/AuthLayout'
import { completeGoogleLogin } from '../../game/storage/authSessionStorage'

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
        navigate(`/login?error=${encodeURIComponent(translateAuthMessage(t, error))}`, { replace: true })
        return
      }

      if (!code && !sessionVerifier) {
        navigate(`/login?error=${encodeURIComponent(t('Google login failed.'))}`, { replace: true })
        return
      }

      try {
        await completeGoogleLogin(code ?? undefined)
        navigate('/', { replace: true })
      } catch (completionError) {
        const message =
          completionError instanceof Error
            ? translateAuthMessage(t, completionError.message)
            : t('Google login failed.')
        navigate(`/login?error=${encodeURIComponent(message)}`, { replace: true })
      }
    }

    void finishLogin()
  }, [navigate, searchParams, t])

  return (
    <AuthLayout
      eyebrow={t('Login')}
      title={t('Bullpen')}
      description={t('Completing Google login...')}
    >
      <></>
    </AuthLayout>
  )
}
