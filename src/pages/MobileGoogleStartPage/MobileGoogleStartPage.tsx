import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { signInWithNeonGoogle } from '../../game/storage/neonAuthClient'

export function MobileGoogleStartPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    async function startGoogleLogin() {
      const appRedirect = searchParams.get('appRedirect')

      if (!appRedirect) {
        return
      }

      const callbackUrl = new URL(`${window.location.origin}/auth/mobile-google/callback`)
      callbackUrl.searchParams.set('appRedirect', appRedirect)

      await signInWithNeonGoogle(callbackUrl.toString())
    }

    void startGoogleLogin()
  }, [searchParams])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Redirecting to Google sign-in...
    </div>
  )
}
