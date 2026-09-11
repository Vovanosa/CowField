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
  LANGUAGE_PATH_PREFIXES,
  getStoredLanguage,
  localizePath,
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
  const { isAuthenticated, isLoading } = useAuth()
  const { search } = useLocation()

  if (isLoading) {
    return null
  }

  // `returnTo` is honoured here too, not just after a successful sign-in: someone who reaches
  // `/register?returnTo=/game/easy/3` while already signed in wanted the level, and bouncing them to
  // `/` would drop the one thing they were trying to get back to.
  return isAuthenticated ? <Navigate to={readReturnTo(search) ?? '/'} replace /> : <Outlet />
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
 * The root of one language's copy of the site, and the only thing that decides which language a page
 * renders in.
 *
 * **The URL is the source of truth.** Before P18 the language was a `localStorage` value read once
 * at module load, so one URL served both languages and Google could only ever see English — the
 * Ukrainian copy the app already had was reachable by no link at all. Mounting the same tree under
 * `/` and `/uk` makes `/about` and `/uk/about` two real pages that can each be indexed, and this
 * component keeps the rendered language matching the path it was reached by.
 *
 * The sync is a **layout** effect, so a back/forward navigation across the two trees repaints in the
 * new language instead of showing one frame of the old one. On a cold load there is nothing to sync:
 * `i18n.ts` reads the same URL when it initialises.
 *
 * **`/` is the one exception (scope P18, decision D7).** A returning visitor whose stored preference
 * is Ukrainian is redirected from `/` to `/uk` — and only from `/`, so a shared English link stays
 * English. A crawler has no stored preference and therefore never sees the redirect.
 */
function LanguageRoute({ language }: { language: SupportedLanguage }) {
  const { pathname } = useLocation()
  const storedLanguage = getStoredLanguage()
  const shouldRedirectToStored = language === 'en' && pathname === '/' && storedLanguage !== 'en'
  const activeLanguage = shouldRedirectToStored ? storedLanguage : language

  useLayoutEffect(() => {
    if (normalizeLanguage(i18n.resolvedLanguage) !== activeLanguage) {
      void i18n.changeLanguage(activeLanguage)
    }
  }, [activeLanguage])

  if (shouldRedirectToStored) {
    // Already an absolute, language-prefixed path, so this is react-router's `Navigate` and not the
    // wrapper: the wrapper would localise it again against the language of the page being left,
    // which is exactly the one being redirected away from.
    return <RouterNavigate to={localizePath('/', storedLanguage)} replace />
  }

  return <Outlet />
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
          // already-signed-in visitor means, rather than being redirected before it can read the
          // code.
          path: 'verify-email',
          element: withSuspense(<VerifyEmailPage />),
        },
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

              It now guards only the routes that genuinely need a session. Four routes are public:
              `/` (the landing page for a visitor, today's home page for a player), `/about`, which
              is the rules content and the best keyword page on the site, and the two pages added in
              P17, `/how-to-solve` and `/difficulties`. Everything else is unchanged — a signed-out
              visitor still gets bounced to `/login` from `/levels`, `/game`, `/settings` and
              `/statistics`.

              Every public route needs three things outside this file or it is invisible: a rewrite
              in `vercel.json` (or a reload 404s at the edge), a `<url>` in `public/sitemap.xml`, and
              an entry in `PUBLIC_ROUTES` in `scripts/check-seo.mts`. Since P18 each of those is a
              **pair** — the English path and its `/uk` counterpart.
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
 * One top-level route per language: `/` for English, `/uk` for Ukrainian.
 *
 * Built from `supportedLanguages` rather than written out twice, so a third language is a prefix in
 * `LANGUAGE_PATH_PREFIXES` and a locale file — not another copy of the tree to keep in step.
 */
const router = createBrowserRouter(
  supportedLanguages.map((language) => ({
    path: LANGUAGE_PATH_PREFIXES[language] || '/',
    element: <LanguageRoute language={language} />,
    errorElement: <RouteErrorElement />,
    children: createLanguageChildren(),
  })),
)

export function AppRouter() {
  return <RouterProvider router={router} />
}
