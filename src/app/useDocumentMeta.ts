import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Per-route `<title>`, description, canonical and `robots` — the whole of the "say what this page
 * is" work, in one hook and with no dependency.
 *
 * Measured 2026-09-10, before this existed: `/`, `/about`, `/levels` and a nonsense path all sent
 * `<title>CowField</title>` with no description, no canonical and no `robots`. Four different URLs,
 * one identical head, and nothing telling a crawler which of the unbounded set of URLs that serve
 * the same document is the real one.
 *
 * A library was not needed. The pattern is `applyDocumentLanguage` in `i18n.ts`, which already keeps
 * `<html lang>` in step with the active language this way.
 */

export type DocumentMeta = {
  /** Full document title. Callers pass it already translated and already branded. */
  title: string
  /** 150–160 characters is what a search result actually shows. Omit on pages nobody should index. */
  description?: string
  /**
   * `noindex` keeps a page out of the index while still letting links on it be followed.
   *
   * Wanted on **every authenticated route** and on the not-found view: they need a session, so a
   * crawler only ever sees them redirect to a login form, and each one indexed is a duplicate of
   * that form. The public pages take the default.
   */
  robots?: 'index' | 'noindex'
  /**
   * The path this page should be indexed under, when that is not the path it is being served from.
   *
   * Only one page needs it: the landing page answers on `/` *and* on `/welcome`, because a
   * signed-in player cannot reach it at `/` — that URL is their home menu. Two URLs serving one
   * page is a duplicate, and the canonical tag is the standard answer: both say `/`, which is the
   * URL that is shared, linked and listed in the sitemap (scope decision D2 stands).
   */
  canonicalPath?: string
}

const DEFAULT_TITLE = 'CowField — a calm Star Battle puzzle'

/**
 * `CowField — <page>`, the pattern for every page except the landing page, which owns the bare
 * branded title.
 *
 * **One name, and it is the same as the domain.** P14 briefly branded the UI differently from the
 * repository and the host (scope decision D1); that was dropped on 2026-09-10 over a naming concern,
 * and the result is the arrangement that should have been chosen first — `<title>`, `<h1>`,
 * structured data and `cowfield.vercel.app` all agree, where before the title said one thing and the
 * page's own heading said another, which makes a weak search result and a confusing share.
 */
export function brandedTitle(pageTitle: string) {
  return `CowField — ${pageTitle}`
}

/** `<meta name="…">` or `<meta property="…">`, created on first use and reused after. */
function upsertMeta(attribute: 'name' | 'property', key: string, content: string | null) {
  const selector = `meta[${attribute}="${key}"]`
  const existing = document.head.querySelector<HTMLMetaElement>(selector)

  if (content === null) {
    existing?.remove()
    return
  }

  const element = existing ?? document.createElement('meta')
  element.setAttribute(attribute, key)
  element.setAttribute('content', content)

  if (!existing) {
    document.head.appendChild(element)
  }
}

function upsertCanonical(href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  const element = existing ?? document.createElement('link')
  element.setAttribute('rel', 'canonical')
  element.setAttribute('href', href)

  if (!existing) {
    document.head.appendChild(element)
  }
}

export function useDocumentMeta({
  title,
  description,
  robots = 'index',
  canonicalPath,
}: DocumentMeta) {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = title || DEFAULT_TITLE

    upsertMeta('name', 'description', description ?? null)
    upsertMeta('name', 'robots', robots === 'noindex' ? 'noindex, follow' : 'index, follow')

    // Absolute, and built from the live origin rather than a configured constant — that way it is
    // correct on localhost, on a preview deployment and on whatever domain this ends up on, with
    // nothing to forget to update. The pathname is stripped of a trailing slash so `/about/` and
    // `/about` cannot both be indexed.
    const servedPath = canonicalPath ?? pathname
    const indexedPath = servedPath === '/' ? '/' : servedPath.replace(/\/+$/, '')
    const canonicalUrl = `${window.location.origin}${indexedPath}`

    upsertCanonical(canonicalUrl)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:title', title || DEFAULT_TITLE)
    upsertMeta('name', 'twitter:title', title || DEFAULT_TITLE)

    if (description) {
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
  }, [canonicalPath, description, pathname, robots, title])
}
