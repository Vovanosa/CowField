import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { translateAuthMessage } from '../../app/translateAuthMessage'
import { useAuth } from '../../app/useAuth'
import { AuthLayout } from '../../components/AuthLayout'

export function GoogleAuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeGoogleLogin, isAuthenticated, isLoading } = useAuth()

  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Wait for the provider to settle before deciding anything.
    if (isLoading) {
      return
    }

    // Already signed in — nothing to complete, and re-running the flow would fail on a spent
    // verifier and bounce to an error page. Just go home.
    if (isAuthenticated) {
      navigate('/', { replace: true })
      return
    }

    // Run exactly once. The verifier is one-shot, so a second pass would find nothing and report a
    // failure over a login that already succeeded.
    if (hasStartedRef.current) {
      return
    }

    hasStartedRef.current = true

    const code = searchParams.get('code')
    const error = searchParams.get('error')
    // Neon's browser client consumes this itself; we only read it to tell a real callback from a
    // stray visit.
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
  }, [completeGoogleLogin, isAuthenticated, isLoading, navigate, searchParams, t])

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
