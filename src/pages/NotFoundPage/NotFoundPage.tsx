import { useTranslation } from 'react-i18next'

import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { EmptyState } from '../../components/EmptyState'
import { TextLink } from '../../components/ui'

/**
 * Replaces a silent `<Navigate to="/" replace />`.
 *
 * A redirect made every mistyped URL indistinguishable from the home page: measured 2026-09-10,
 * `/this-page-does-not-exist` returned **200** and rendered the app, which is an unbounded supply of
 * soft-404s for a crawler to index. `vercel.json` now 404s unknown paths at the edge so most never
 * reach the app at all; this covers the ones that do — a wrong path *under* a known prefix, like
 * `/levels/nonsense` — and it says `noindex` rather than pretending to be content.
 */
export function NotFoundPage() {
  const { t } = useTranslation()

  useDocumentMeta({
    title: brandedTitle(t('Page not found')),
    robots: 'noindex',
  })

  return (
    <div className="page-shell page-shell-compact">
      <EmptyState
        message={t('That link does not lead anywhere.')}
        actions={<TextLink to="/">{t('Back to the start')}</TextLink>}
      />
    </div>
  )
}
