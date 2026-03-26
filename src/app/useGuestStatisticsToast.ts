import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const TOAST_DURATION_MS = 2600

export function useGuestStatisticsToast() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const hideTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  function showToast() {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current)
    }

    setIsVisible(true)
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false)
      hideTimeoutRef.current = null
    }, TOAST_DURATION_MS)
  }

  return {
    toastMessage: isVisible ? t('Statistics is available only for logged users.') : null,
    showToast,
  }
}
