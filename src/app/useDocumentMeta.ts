import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import {
  languageFromPathname,
  localizePath,
  stripLanguagePrefix,
  supportedLanguages,
} from '../i18n'

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
   *
   * **Write it language-neutral** — `/`, not `/uk`. The hook adds the prefix of whichever language
   * tree the page was reached in, so `/uk/welcome` canonicalises to `/uk` and not to `/`. Getting
   * that wrong is the single worst thing this hook could do: a Ukrainian page pointing its canonical
   * at the English one tells Google to drop every Ukrainian URL on the site.
   */
  canonicalPath?: string
}

const DEFAULT_TITLE = 'Play Star Battle online, free - CowField'

/**
 * `<page> - CowField`. The brand goes **last**.
 *
 * It used to go first, which spent the most valuable position in a search result on a word nobody
 * searches for. Nobody types "CowField"; they type "star battle puzzle", "two not touch", "how to
 * solve star battle". Google truncates a title around 60 characters and weights the front of it, so
 * the query-bearing half has to be the half that survives. The brand still appears, which is what
 * makes the result recognisable once someone has seen the site before.
 *
 * **One name, and it is the same as the domain.** P14 briefly branded the UI differently from the
 * repository and the host (scope decision D1); that was dropped on 2026-09-10 over a naming concern,
 * and the result is the arrangement that should have been chosen first: `<title>`, `<h1>`,
 * structured data and `cowfield.vercel.app` all agree.
 */
export function brandedTitle(pageTitle: string) {
  return `${pageTitle} - CowField`
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

/**
 * The `hreflang` set: one `<link rel="alternate">` per language, plus `x-default`.
 *
 * **Both halves of a pair have to declare each other or neither counts.** A one-way hreflang is
 * ignored silently — no warning in Search Console, no error in the console, the page simply never
 * gets associated with its counterpart. Emitting the *whole* set from one place, on every page, is
 * what makes reciprocity structural rather than something to remember: `/about` and `/uk/about` run
 * the same code over the same neutral path, so they cannot disagree.
 *
 * `x-default` points at English, which is the root and the version to serve a reader whose language
 * we have nothing better for.
 *
 * Replaced wholesale rather than updated in place: the set is three tags, and a stale one left
 * behind from the previous route is worse than the cost of recreating them.
 */
function replaceAlternates(hrefsByHreflang: Record<string, string> | null) {
  document.head
    .querySelectorAll('link[data-language-alternate]')
    .forEach((element) => element.remove())

  if (!hrefsByHreflang) {
    return
  }

  Object.entries(hrefsByHreflang).forEach(([hreflang, href]) => {
    const element = document.createElement('link')
    element.setAttribute('rel', 'alternate')
    element.setAttribute('hreflang', hreflang)
    element.setAttribute('href', href)
    element.setAttribute('data-language-alternate', '')
    document.head.appendChild(element)
  })
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
    //
    // Everything is computed from the **language-neutral** path, and the prefix is put back on at
    // the end. That is what lets one expression produce both the canonical for this page and the
    // href of each of its alternates.
    const servedPath = canonicalPath ?? stripLanguagePrefix(pathname)
    const neutralPath = servedPath === '/' ? '/' : servedPath.replace(/\/+$/, '')
    const language = languageFromPathname(pathname)
    const toAbsoluteUrl = (targetLanguage: (typeof supportedLanguages)[number]) =>
      `${window.location.origin}${localizePath(neutralPath, targetLanguage)}`
    const canonicalUrl = toAbsoluteUrl(language)

    upsertCanonical(canonicalUrl)

    // Only for pages that are actually indexable. Declaring alternates for a `noindex` page asks
    // Google to relate two pages it has been told to drop.
    replaceAlternates(
      robots === 'noindex'
        ? null
        : {
            ...Object.fromEntries(
              supportedLanguages.map((code) => [code, toAbsoluteUrl(code)] as const),
            ),
            'x-default': toAbsoluteUrl('en'),
          },
    )

    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:title', title || DEFAULT_TITLE)
    upsertMeta('name', 'twitter:title', title || DEFAULT_TITLE)

    if (description) {
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
  }, [canonicalPath, description, pathname, robots, title])
}
