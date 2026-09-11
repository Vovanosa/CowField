import { Share2 } from 'lucide-react'
import { useState } from 'react'

import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { Button } from '../../components/ui'

type ShareLevelButtonProps = {
  className?: string
  t: (key: string, options?: Record<string, unknown>) => string
  onShared: (message: string) => void
}

/**
 * Sends someone this level.
 *
 * **No time in the message, ever** (scope decision D6). A first draft gated sharing on a first
 * completion so a shared time would be honest, and it collapsed under its own weight: guests have
 * the timer forced off, so the people most likely to share a link had no time to share, and any
 * rule about "honest" times invites exactly the comparison this game is built to avoid. One message
 * for every case is both simpler and truer to the product.
 *
 * `navigator.share` where the browser has it — on a phone that is the native sheet, which is where
 * most of this will happen — and a clipboard copy everywhere else. No dependency for either, and a
 * browser with neither simply never shows the button rather than showing one that does nothing.
 *
 * The URL is the page as it stands, so a Ukrainian player shares the `/uk/` link and their reader
 * lands in Ukrainian.
 */
export function ShareLevelButton({ className, t, onShared }: ShareLevelButtonProps) {
  const [isBusy, setIsBusy] = useState(false)

  const canShare = typeof navigator !== 'undefined' && (Boolean(navigator.share) || Boolean(navigator.clipboard))

  if (!canShare) {
    return null
  }

  async function handleShare() {
    // Query and hash stripped: neither carries meaning on a level, and a stray `?returnTo` from the
    // sign-up flow has no business travelling to someone else.
    const url = `${window.location.origin}${window.location.pathname}`
    const text = t('Play this Star Battle level on CowField')

    setIsBusy(true)

    try {
      if (navigator.share) {
        await navigator.share({ title: 'CowField', text, url })
        return
      }

      await navigator.clipboard.writeText(url)
      onShared(t('Link copied.'))
    } catch (error) {
      // Dismissing the native sheet rejects with `AbortError`. That is a choice, not a failure, and
      // reporting it would turn every cancelled share into noise in the error log.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      reportUnexpectedError(error, 'sharing a level')
      onShared(t("Couldn't share this level."))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Button
      className={className}
      onClick={() => void handleShare()}
      disabled={isBusy}
      leadingIcon={<Share2 size={18} />}
      collapseLabelOnNarrow
    >
      {t('Share')}
    </Button>
  )
}
