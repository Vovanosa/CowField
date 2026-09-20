import { Check, Copy, ImageDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { Dialog } from '../Dialog'
import { QrCode } from '../QrCode'
import { Button } from '../ui'
import { canCopyImages, copyQrImageToClipboard } from './copyQrImage'
import styles from './ShareDialog.module.css'

type ShareDialogProps = {
  /** The absolute URL being shared — the site's front door in the reader's current language. */
  url: string
  onClose: () => void
}

/** How long the button stays in its "copied" state before returning to normal. */
const COPIED_FEEDBACK_MS = 2000

/**
 * Two ways to pass the site on: the link, and the same link as a QR code.
 *
 * **Two, not five.** No per-network share buttons — each one is a third-party script or a URL
 * scheme that rots, and the two things people actually do with a link like this are paste it
 * somewhere and point a phone at it.
 *
 * The QR exists for the case the copy button cannot serve at all: showing someone your screen.
 * That is also why the URL is printed in full underneath rather than hidden behind the button —
 * it is readable, and a reader can type it if everything else fails.
 */
type CopyStatus = 'idle' | 'copied' | 'failed'

export function ShareDialog({ url, onClose }: ShareDialogProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<CopyStatus>('idle')
  const [imageStatus, setImageStatus] = useState<CopyStatus>('idle')
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imageResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qrRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
      if (imageResetTimerRef.current) {
        clearTimeout(imageResetTimerRef.current)
      }
    }
  }, [])

  async function handleCopy() {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }

    try {
      /*
        `navigator.clipboard` is absent on an insecure origin and can reject when the document is
        not focused, so this is never assumed to work. The URL is on screen either way, which is
        what keeps a failure survivable rather than a dead end.
      */
      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch (error) {
      reportUnexpectedError(error, 'copying the share link')
      setStatus('failed')
    }

    resetTimerRef.current = setTimeout(() => setStatus('idle'), COPIED_FEEDBACK_MS)
  }

  async function handleCopyImage() {
    if (imageResetTimerRef.current) {
      clearTimeout(imageResetTimerRef.current)
    }

    const svg = qrRef.current

    if (!svg) {
      return
    }

    try {
      await copyQrImageToClipboard(svg)
      setImageStatus('copied')
    } catch (error) {
      reportUnexpectedError(error, 'copying the QR code as an image')
      setImageStatus('failed')
    }

    imageResetTimerRef.current = setTimeout(() => setImageStatus('idle'), COPIED_FEEDBACK_MS)
  }

  const canCopy = typeof navigator !== 'undefined' && Boolean(navigator.clipboard)

  return (
    <Dialog
      title={t('Share CowField')}
      labelledById="share-dialog-title"
      describedById="share-dialog-description"
      onClose={onClose}
      className={styles.dialog}
      description={
        <div className={styles.body}>
          <p className={styles.lead}>{t('Send someone the game, or let them scan it.')}</p>

          <div className={styles.linkRow}>
            {/*
              Read-only rather than plain text: it is selectable, and a keyboard user can tab to it
              and copy with the shortcut they already use if the button fails them.
            */}
            <input
              className={styles.linkField}
              value={url}
              readOnly
              aria-label={t('Link to CowField')}
              onFocus={(event) => event.currentTarget.select()}
            />
            {canCopy ? (
              <Button
                variant="primary"
                className={styles.copyButton}
                onClick={() => void handleCopy()}
                leadingIcon={status === 'copied' ? <Check size={16} /> : <Copy size={16} />}
              >
                {status === 'copied' ? t('Copied') : t('Copy link')}
              </Button>
            ) : null}
          </div>

          {/*
            `aria-live` so the outcome is announced rather than only shown — the button's own label
            changing is easy to miss, and a failure has to be heard.
          */}
          <p className={styles.status} role="status" aria-live="polite">
            {status === 'copied' ? t('Link copied.') : null}
            {status === 'failed' ? t("Couldn't copy the link. Select it and copy manually.") : null}
          </p>

          <div className={styles.qrBlock}>
            <QrCode ref={qrRef} value={url} label={t('QR code linking to CowField')} />
            <p className={styles.qrCaption}>{t('Point a phone camera at this to open the game.')}</p>

            {/*
              Absent rather than disabled where the browser cannot write an image to the clipboard —
              a button that does nothing is worse than one that is not there. The link above still
              works everywhere.
            */}
            {canCopyImages() ? (
              <>
                <Button
                  className={styles.copyImageButton}
                  onClick={() => void handleCopyImage()}
                  leadingIcon={
                    imageStatus === 'copied' ? <Check size={16} /> : <ImageDown size={16} />
                  }
                >
                  {imageStatus === 'copied' ? t('Image copied') : t('Copy image')}
                </Button>
                <p className={styles.status} role="status" aria-live="polite">
                  {imageStatus === 'copied' ? t('Paste it anywhere that takes a picture.') : null}
                  {imageStatus === 'failed' ? t("Couldn't copy the image.") : null}
                </p>
              </>
            ) : null}
          </div>
        </div>
      }
      actions={
        <Button onClick={onClose} className={styles.closeButton}>
          {t('Close')}
        </Button>
      }
    />
  )
}
