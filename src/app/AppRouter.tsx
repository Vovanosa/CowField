import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  type ComponentType,
  type ReactNode,
} from 'react'
import {
  Navigate as RouterNavigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  type RouteObject,
} from 'react-router-dom'

import { AppShell } from './AppShell'
import { HomeRoute } from './HomeRoute'
import { Navigate } from './navigation'
import { readReturnTo } from './returnTo'
import { RouteErrorElement } from './RouteErrorElement'
import { useAuth } from './useAuth'
import { applyThemeMode } from '../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../game/usePlayerSettings'
import i18n, {
  applyLanguage,
  getPreferredLanguage,
  LANGUAGES,
  localizeHref,
  normalizeLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from '../i18n'

function lazyPage<T extends ComponentType<object>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(load)
}

/*
  **Every** page is lazy now, not just the ones that felt heavy.

  Six of them — Home, About, Levels, DifficultyLevels, Settings, Statistics — used to be imported
  eagerly, so the entry chunk was 727 KB and a first-time visitor to the landing page downloaded the
  whole app, including pages they had no session to reach. Route-splitting is the only lever that
  matters for Core Web Vitals here, and the pages were already route-scoped; this is just moving them
  behind `import()`.
*/
const AboutPage = lazyPage(() =>
  import('../pages/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const AboutProjectPage = lazyPage(() =>
  import('../pages/AboutProjectPage').then((module) => ({ default: module.AboutProjectPage })),
)
const CreateLevelPage = lazyPage(() =>
  import('../pages/CreateLevelPage').then((module) => ({ default: module.CreateLevelPage })),
)
const DifficultiesPage = lazyPage(() =>
  import('../pages/DifficultiesPage').then((module) => ({ default: module.DifficultiesPage })),
)
const DifficultyLevelsPage = lazyPage(() =>
  import('../pages/DifficultyLevelsPage').then((module) => ({
    default: module.DifficultyLevelsPage,
  })),
)
const ForgotPasswordPage = lazyPage(() =>
  import('../pages/ForgotPasswordPage/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const GamePage = lazyPage(() =>
  import('../pages/GamePage').then((module) => ({ default: module.GamePage })),
)
const GoogleAuthCallbackPage = lazyPage(() =>
  import('../pages/GoogleAuthCallbackPage/GoogleAuthCallbackPage').then((module) => ({
    default: module.GoogleAuthCallbackPage,
  })),
)
const HowToSolvePage = lazyPage(() =>
  import('../pages/HowToSolvePage').then((module) => ({ default: module.HowToSolvePage })),
)
const LandingPage = lazyPage(() =>
  import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })),
)
const LevelsPage = lazyPage(() =>
  import('../pages/LevelsPage').then((module) => ({ default: module.LevelsPage })),
)
const LoginPage = lazyPage(() =>
  import('../pages/LoginPage/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const NotFoundPage = lazyPage(() =>
  import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const RegisterPage = lazyPage(() =>
  import('../pages/RegisterPage/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const ResetPasswordPage = lazyPage(() =>
  import('../pages/ResetPasswordPage/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
const SettingsPage = lazyPage(() =>
  import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const StatisticsPage = lazyPage(() =>
  import('../pages/StatisticsPage').then((module) => ({ default: module.StatisticsPage })),
)
const VerifyEmailPage = lazyPage(() =>
  import('../pages/VerifyEmailPage/VerifyEmailPage').then((module) => ({
    default: module.VerifyEmailPage,
  })),
)

function withSuspense(element: ReactNode) {
  return <Suspense fallback={null}>{element}</Suspense>
}

function RequireSession() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function RequireNonGuest() {
  const { isGuest } = useAuth()

  return isGuest ? <Navigate to="/" replace /> : <Outlet />
}

function PublicOnlyRoute() {
  const { isAuthenticated, isGuest, isLoading } = useAuth()
  const { search } = useLocation()

  if (isLoading) {
    return null
  }

  /*
    **A guest is authenticated but has no account, so these pages are the only way to get one.**

    This used to bounce on `isAuthenticated` alone, which is true for a guest — so the *Sign up*
    button in the profile menu linked to `/register` and the guard sent them straight back to `/`.
    From the outside the button did nothing, and because a guest deliberately has no *Log out*
    (decision D8) there was no way out of guest mode at all: the one entry point to an account was
    closed by the guard protecting it.

    Registering carries their times over (`AuthProvider.register`); signing in to an existing
    account leaves them behind and warns first (decision D5). Both are reachable now.

    `returnTo` is honoured here too, not just after a successful sign-in: someone who reaches
    `/register?returnTo=/game/easy/3` while already signed in wanted the level, and bouncing them to
    `/` would drop the one thing they were trying to get back to.
  */
  const hasAccount = isAuthenticated && !isGuest

  return hasAccount ? <Navigate to={readReturnTo(search) ?? '/'} replace /> : <Outlet />
}

function PublicShell() {
  const settings = usePlayerSettings()

  useEffect(() => {
    applyThemeMode(settings.darkModeEnabled)
  }, [settings.darkModeEnabled])

  return (
    <div className="app-shell">
      <div className="app-frame">
        <main className="app-content">
          <div className="route-stage">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Keeps the rendered language matching the URL that was navigated to.
 *
 * A **layout** effect, so a back/forward navigation across two language trees repaints in the new
 * language instead of showing one frame of the old one. On a cold load there is nothing to sync:
 * `i18n.ts` reads the same URL when it initialises.
 */
function useSyncedLanguage(language: SupportedLanguage) {
  useLayoutEffect(() => {
    if (normalizeLanguage(i18n.resolvedLanguage) !== language) {
      /*
        `applyLanguage` and not `i18n.changeLanguage`: since 2026-09-20 only English is in the
        bundle, so switching to Ukrainian has to fetch its dictionary first. The page therefore
        stays in the language being left for the length of one chunk fetch rather than flashing
        English at a `/uk` URL, and that only happens on the first switch of a session.
      */
      void applyLanguage(language)
    }
  }, [language])
}

/**
 * The root of one language's copy of the site, and the only thing that decides which language a page
 * renders in.
 *
 * **The URL is the source of truth.** Before P18 the language was a `localStorage` value read once
 * at module load, so one URL served both languages and Google could only ever see English — the
 * Ukrainian copy the app already had was reachable by no link at all. Mounting the same tree under
 * `/en` and `/uk` makes `/en/about` and `/uk/about` two real pages that can each be indexed, and
 * this component keeps the rendered language matching the path it was reached by.
 */
function LanguageRoute({ language }: { language: SupportedLanguage }) {
  useSyncedLanguage(language)

  return <Outlet />
}

/**
 * The root of the handful of URLs that carry no language, because Neon Auth already has them
 * written down. They render in the visitor's own language rather than always in English.
 */
function UnprefixedRoute() {
  useSyncedLanguage(getPreferredLanguage())

  return <Outlet />
}

/**
 * **`/` is not a page. It is a decision**, and this is the whole of it: work out which language
 * this visitor wants and send them to the same path inside that language's tree.
 *
 * Until 2026-09-21 English *was* the root, and this job did not exist — `/` rendered English and a
 * returning Ukrainian visitor got a redirect from it (decision D7). Now that every language has a
 * prefix, the redirect is the only thing `/` does, and it does it for everyone. The rule it
 * generalises is the same one: a stored choice wins, a browser preference is the next best thing,
 * and English is what is left.
 *
 * It is mounted at `*` as well as at `/`, which is what makes a bare `/about` still work. Those
 * are the URLs the site was indexed under before the move; `vercel.json` answers them with a
 * permanent redirect at the edge in production, and this is the same answer for a local build,
 * where there is no edge. A path that is genuinely unknown lands in a language tree and meets its
 * `*` there, which is the real not-found page.
 *
 * Query and hash survive, because a shared `/game/easy/3?from=…` must arrive intact.
 */
function LanguageGateway() {
  const { pathname, search, hash } = useLocation()

  // react-router's `Navigate` and not the wrapper from `./navigation`: the target is already an
  // absolute, language-prefixed path, and the wrapper would localise it a second time against the
  // language of the URL being left — which is the one that has no language.
  return (
    <RouterNavigate to={localizeHref(`${pathname}${search}${hash}`, getPreferredLanguage())} replace />
  )
}

/**
 * One language's routes. Called once per supported language, so the two trees cannot drift.
 *
 * **Every path here is relative.** They used to be absolute (`/login`, `/about`), which a nested
 * route cannot be once it has a `/uk` parent — react-router rejects an absolute child path that is
 * not a descendant of its parent's. Relative paths resolve against whichever language root mounted
 * them, and that is the whole mechanism.
 */
function createLanguageChildren(): RouteObject[] {
  return [
    {
      element: <PublicShell />,
      errorElement: <RouteErrorElement />,
      children: [
        /*
          The OAuth callback, `/verify-email` and `/reset-password` are **not** here. They are the
          three URLs this app does not own: `authSessionStorage.ts` hands them to Neon Auth as
          absolute paths, the callback is registered in its console and the other two are sitting in
          people's inboxes right now. They are mounted unprefixed at the root instead — see
          `createUnprefixedRoutes` below.
        */
        {
          element: <PublicOnlyRoute />,
          children: [
            {
              path: 'login',
              element: withSuspense(<LoginPage />),
            },
            {
              path: 'register',
              element: withSuspense(<RegisterPage />),
            },
            {
              path: 'forgot-password',
              element: withSuspense(<ForgotPasswordPage />),
            },
          ],
        },
      ],
    },
    {
      element: <AppShell />,
      // Catches a throw in the shell itself, where there is no outlet left to render into.
      errorElement: <RouteErrorElement />,
      children: [
        {
          // A pathless layout route, so a throw from a page renders inside the shell's
          // `<Outlet />` and leaves the header and navigation usable.
          errorElement: <RouteErrorElement />,
          children: [
            /*
              `RequireSession` used to wrap this entire subtree, which is why nothing on the site was
              indexable: measured 2026-09-10, `/`, `/about`, `/levels` and a nonsense path all
              rendered the same login form, 31 words, one `<title>`.

              It now guards only the routes that genuinely need a session. Five routes are public:
              the index (the landing page for a visitor, today's home page for a player), `about`,
              which is the rules content and the best keyword page on the site, the two pages added
              in P17, `how-to-solve` and `difficulties`, and `about-project`. Everything else is
              unchanged — a signed-out visitor still gets bounced to `login` from `levels`, `game`,
              `settings` and `statistics`.

              A public route needs **one** thing outside this file or it is invisible: an entry in
              `scripts/publicPages.ts`, which is what `public/sitemap.xml`, `public/robots.txt` and
              `npm run check:seo` are all built from. It used to need a rewrite in `vercel.json` as
              well, one per path per language; since every language sits behind a prefix those
              collapsed into `/en/:path*` and `/uk/:path*`, and the whole class of "new page 404s on
              reload" went with them.
            */
            {
              index: true,
              element: withSuspense(<HomeRoute />),
            },
            {
              // Public. Verified to need no session: no `useAuth`, no fetch, no storage.
              path: 'about',
              element: withSuspense(<AboutPage />),
            },
            {
              // Public, same bar as `/about`. Star Battle technique rather than app instructions.
              path: 'how-to-solve',
              element: withSuspense(<HowToSolvePage />),
            },
            {
              // Public. What changes between board sizes, and the extreme caveat in plain words.
              path: 'difficulties',
              element: withSuspense(<DifficultiesPage />),
            },
            {
              /*
                Public. Who built this and why — the project and its author, not the puzzle.

                Distinct from `/about` on purpose, which is the rules page and is named for what a
                searcher wants rather than for what the app calls it. Two pages with "about" in the
                path is a little awkward; the alternative was renaming `/about`, which is indexed,
                linked from the footer and named in the sitemap, and not worth breaking for tidiness.
              */
              path: 'about-project',
              element: withSuspense(<AboutProjectPage />),
            },
            {
              /*
                The landing page, on a URL that does not change meaning with the session.

                `/` cannot do that job for a **player**: `HomeRoute` gives them the home menu there,
                which is right, and left the landing page unreachable once anyone signed in — there
                was no link to it from anywhere in the app. The profile menu now points here.

                Not a second marketing URL: it declares `/` as its canonical, so the page that gets
                crawled, shared and listed in the sitemap is still `/` alone (scope decision D2).
                A canonical rather than `noindex`, because the two contradict each other — `noindex`
                on a duplicate tells Google to drop the page instead of crediting the original.

                Note this also needs a rewrite in `vercel.json`, or a reload on `/welcome` 404s at
                the edge like any other unlisted path.
              */
              path: 'welcome',
              element: withSuspense(<LandingPage />),
            },
            /*
              **Public since P18.** A level link is the thing people send each other, and until now
              it answered with a login form for everyone who was not already signed in.

              `/game/*` stays `noindex` (decision D3) and `Disallow`ed: it is shareable, not
              searchable. A blurred board behind a gate is a thin page, and a thousand of them is the
              doorway-page pattern — the listing pages are what this programme asks Google to rank.

              The board renders for real and `GameAccessGate` blurs it behind a choice. The gate is
              the *only* thing standing between a visitor and play, and it is one click either way.
            */
            {
              path: 'levels',
              element: withSuspense(<LevelsPage />),
            },
            {
              path: 'levels/:difficulty',
              element: withSuspense(<DifficultyLevelsPage />),
            },
            {
              path: 'game/:difficulty/:levelNumber',
              element: withSuspense(<GamePage />),
            },
            {
              element: <RequireSession />,
              children: [
                // Authoring. Hidden from non-admins in the UI and admin-gated on the server; the
                // session guard here is the outer of the three (universal rule 6).
                {
                  path: 'levels/:difficulty/create',
                  element: withSuspense(<CreateLevelPage />),
                },
                {
                  path: 'levels/:difficulty/:levelNumber/edit',
                  element: withSuspense(<CreateLevelPage />),
                },
                {
                  element: <RequireNonGuest />,
                  children: [
                    {
                      path: 'statistics',
                      element: withSuspense(<StatisticsPage />),
                    },
                  ],
                },
                {
                  path: 'settings',
                  element: withSuspense(<SettingsPage />),
                },
              ],
            },
            {
              /*
                A real not-found view instead of a redirect to `/`. That redirect made every mistyped
                URL look like the home page, and `vercel.json` served all of them with a 200 — an
                unbounded supply of soft-404s. Unknown *top-level* paths now 404 at the edge; this
                catches the rest, such as `/levels/nonsense`, and reports `noindex`.
              */
              path: '*',
              element: withSuspense(<NotFoundPage />),
            },
          ],
        },
      ],
    },
  ]
}

/**
 * The three URLs that cannot carry a language prefix, because something outside this app has them
 * written down: the Google OAuth callback is registered in the Neon Auth console, and the
 * verification and password-reset links are in emails that were sent before any of this changed.
 *
 * Prefixing them would break a sign-up that started yesterday — a failure nobody reports, because
 * from the outside it is just a link that does not work. They are listed in `UNPREFIXED_PATHS` in
 * `src/languages.ts`, which is also what keeps them out of the per-language `robots.txt` rules.
 */
function createUnprefixedRoutes(): RouteObject[] {
  return [
    {
      path: 'auth/google/callback',
      element: withSuspense(<GoogleAuthCallbackPage />),
    },
    {
      path: 'reset-password',
      element: withSuspense(<ResetPasswordPage />),
    },
    {
      // Outside `PublicOnlyRoute` on purpose, like the OAuth callback: the page decides what an
      // already-signed-in visitor means, rather than being redirected before it can read the code.
      path: 'verify-email',
      element: withSuspense(<VerifyEmailPage />),
    },
  ]
}

/**
 * One top-level route per language — `/en`, `/uk` — plus the root, which belongs to no language.
 *
 * The per-language trees are built from `supportedLanguages` rather than written out once each, so
 * a third language is a row in `LANGUAGES` and a locale file, not another copy of the tree to keep
 * in step. **English is no longer special**: it has a prefix like everything else, and `/` is a
 * gateway rather than the English home page (2026-09-21, superseding decision D1).
 *
 * Route ranking is what keeps the root's `*` from swallowing the language trees: `/en/about`
 * scores above `/*`, and `/en/nonsense` matches `/en/*` — the real not-found page — rather than
 * bouncing back through the gateway.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <UnprefixedRoute />,
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, element: <LanguageGateway /> },
      {
        element: <PublicShell />,
        errorElement: <RouteErrorElement />,
        children: createUnprefixedRoutes(),
      },
      { path: '*', element: <LanguageGateway /> },
    ],
  },
  ...supportedLanguages.map((language) => ({
    path: LANGUAGES[language].prefix,
    element: <LanguageRoute language={language} />,
    errorElement: <RouteErrorElement />,
    children: createLanguageChildren(),
  })),
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
