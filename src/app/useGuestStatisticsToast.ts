import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const TOAST_DURATION_MS = 2600

export function useGuestStatisticsToast() {
  const { t } = useTranslation()
  const [toastSequence, setToastSequence] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (toastSequence === 0) {
      return
    }

    setIsVisible(true)
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
    }, TOAST_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toastSequence])

  return {
    toastMessage: isVisible ? t('Statistics is available only for logged users.') : null,
    showToast: () => setToastSequence((currentValue) => currentValue + 1),
  }
}
