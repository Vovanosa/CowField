import { useCallback } from 'react'
import {
  Link as RouterLink,
  Navigate as RouterNavigate,
  useLocation,
  useNavigate as useRouterNavigate,
  type LinkProps,
  type NavigateOptions,
  type NavigateProps,
  type To,
} from 'react-router-dom'

import {
  languageFromPathname,
  localizeHref,
  localizePath,
  mirrorLocationForLanguage,
  type SupportedLanguage,
} from '../i18n'

/**
 * The app's `Link`, `Navigate` and `useNavigate` — the same three things react-router exports, with
 * the current language's URL prefix applied to every absolute path.
 *
 * **Why they have to be wrapped.** The route tree is mounted twice, at `/` and at `/uk`
 * (`AppRouter`), so a component sitting on `/uk/about` and a component sitting on `/about` are the
 * same component. A bare `<Link to="/levels">` in it sends the Ukrainian reader to the *English*
 * tree, silently, with no error anywhere — the page just changes language under them. Every
 * internal link in the app is a chance to do that, so the fix belongs at the link, not at the 40
 * call sites.
 *
 * Paths written in components stay language-neutral (`/levels`, `/game/easy/3`), which is what makes
 * them readable. `localizePath` is idempotent, so passing an already-prefixed path is harmless.
 *
 * **`eslint.config.js` forbids importing these three from `react-router-dom` anywhere else**, which
 * is the only thing stopping the next `<Link>` from reintroducing the bug.
 *
 * Anything that is not an absolute string path — a relative `to`, an external URL handled by a plain
 * `<a>` — passes through untouched.
 */

/** The language of the page being rendered, read from the URL rather than from stored settings. */
export function useLanguage(): SupportedLanguage {
  return languageFromPathname(useLocation().pathname)
}

function localizeTo(to: To, language: SupportedLanguage): To {
  if (typeof to === 'string') {
    return to.startsWith('/') ? localizeHref(to, language) : to
  }

  if (typeof to.pathname === 'string' && to.pathname.startsWith('/')) {
    return { ...to, pathname: localizePath(to.pathname, language) }
  }

  return to
}

export function Link({ to, ...props }: LinkProps) {
  const language = useLanguage()

  return <RouterLink {...props} to={localizeTo(to, language)} />
}

export function Navigate({ to, ...props }: NavigateProps) {
  const language = useLanguage()

  return <RouterNavigate {...props} to={localizeTo(to, language)} />
}

export function useNavigate() {
  const navigate = useRouterNavigate()
  const language = useLanguage()

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        void navigate(to)
        return
      }

      void navigate(localizeTo(to, language), options)
    },
    [language, navigate],
  )
}

/**
 * The one navigation that deliberately crosses from one language tree to the other: the same page,
 * in the other language, keeping the query string and hash.
 *
 * It cannot go through `useNavigate` above, which localises against the language of the page being
 * left — that would strip the prefix straight back off. This is the only place a target language is
 * named explicitly, which is why it lives here rather than in the two switchers that call it.
 *
 * Changing the URL is the whole change. `LanguageRoute` sees the new path and moves `i18n` with it,
 * so no caller has to touch `i18n.changeLanguage` — a caller that did would flip the UI language
 * while leaving the URL, and therefore the canonical and the `hreflang` pair, describing the old one.
 */
export function useSwitchLanguage() {
  const navigate = useRouterNavigate()
  const location = useLocation()

  return useCallback(
    (language: SupportedLanguage) => {
      void navigate(mirrorLocationForLanguage(location, language))
    },
    [location, navigate],
  )
}

type LanguageLinkProps = Omit<LinkProps, 'to' | 'hrefLang' | 'lang'> & {
  /** The language to link to — named explicitly, unlike every other link in the app. */
  language: SupportedLanguage
}

/**
 * The same page in the named language, as a **real `<a href>`**.
 *
 * It cannot be the `Link` above. That one localises against the language of the page it is rendered
 * on, so on `/about` a `<Link to="/about">` is a link to `/about` — asking it for the Ukrainian
 * version gives back the English one. Like `useSwitchLanguage`, this names a target language, which
 * is why it lives here beside it rather than in the components that call it.
 *
 * **It exists for the crawler as much as for the reader** (added 2026-09-19). Before it, nothing on
 * the English site linked to `/uk` at all. `public/sitemap.xml` declares all twenty URLs and every
 * page emits the `hreflang` set, but **`hreflang` is an alternates hint, not a path** — it tells a
 * crawler which version to serve someone, not that a page exists to be found. The only other route
 * to the Ukrainian tree was `LanguageSwitcher`, and that lived in a dropdown that is not in the DOM
 * until it is opened. Googlebot follows links; it does not open menus. So `/uk` and `/uk/levels` sat
 * uncrawled, and requesting indexing by hand hit Search Console's daily quota for a week straight.
 *
 * `hrefLang` and `lang` are set here and not overridable: `hrefLang` tells a crawler what is on the
 * other end, and `lang` is what makes a screen reader pronounce "Українською" with Ukrainian
 * phonetics instead of English ones.
 */
export function LanguageLink({ language, ...props }: LanguageLinkProps) {
  const location = useLocation()

  return (
    <RouterLink
      {...props}
      to={mirrorLocationForLanguage(location, language)}
      hrefLang={language}
      lang={language}
    />
  )
}
