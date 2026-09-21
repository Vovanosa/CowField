/**
 * What the crawler-facing files are made of: the indexable pages, and the paths that must stay out
 * of the index.
 *
 * **Everything here is language-neutral** unless a group says otherwise. `build-seo-files.mts`
 * expands each entry across `supportedLanguages`, and `check-seo.mts` checks each expansion against
 * a running deployment, so the sitemap, `robots.txt` and the assertions cannot disagree about which
 * pages exist — they are three readings of this list.
 *
 * Adding a public page is an entry here, a route in `AppRouter`, and a rewrite in `vercel.json`.
 * Miss the rewrite and a reload 404s at the edge; miss this and the page is invisible.
 */

export type PublicPage = {
  /** Language-neutral path, exactly as it is written in the route tree. */
  path: string
  changefreq: 'weekly' | 'monthly' | 'yearly'
  /** A string, not a number, so `1.0` survives the round trip to XML. */
  priority: string
}

/**
 * **`/` must stay first** — `check-seo.mts` reads the first entry for the landing page's word-count
 * and structured-data assertions. It is the neutral path: in the sitemap it appears as `/en` and
 * `/uk`, never as the bare root, which redirects and therefore does not belong in a sitemap.
 *
 * `/about-project` is the lowest priority here and the only `yearly` entry. It is who built the
 * thing rather than anything a person searches for, and saying so is more honest than giving every
 * page 0.8 and a weekly crawl it does not need.
 */
export const PUBLIC_PAGES: PublicPage[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/levels', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/how-to-solve', changefreq: 'monthly', priority: '0.8' },
  { path: '/levels/light', changefreq: 'weekly', priority: '0.8' },
  { path: '/levels/easy', changefreq: 'weekly', priority: '0.8' },
  { path: '/levels/medium', changefreq: 'weekly', priority: '0.8' },
  { path: '/levels/hard', changefreq: 'weekly', priority: '0.8' },
  { path: '/levels/extreme', changefreq: 'weekly', priority: '0.8' },
  { path: '/difficulties', changefreq: 'monthly', priority: '0.7' },
  { path: '/about-project', changefreq: 'yearly', priority: '0.4' },
]

export const PUBLIC_PATHS = PUBLIC_PAGES.map((page) => page.path)

export type RobotsGroup = {
  /** Why these are disallowed. Written into `robots.txt` above the rules. */
  comment: string
  /** Paths or prefixes. A trailing `/` disallows a subtree. */
  paths: string[]
  /**
   * Write these once, exactly as given, instead of once per language — for the URLs that carry no
   * language prefix because something outside the app has them registered. See `UNPREFIXED_PATHS`
   * in `src/languages.ts`.
   */
  unprefixed?: boolean
}

export const ROBOTS_GROUPS: RobotsGroup[] = [
  {
    comment: 'Credential forms. Nothing to index, and no reason to fetch them.',
    paths: ['/login', '/register', '/forgot-password'],
  },
  {
    comment: [
      'The same, for the three URLs that carry no language prefix: Neon Auth has the OAuth callback',
      'registered and puts the other two into emails, so they answer at the root and only there.',
    ].join('\n'),
    paths: ['/auth/', '/verify-email', '/reset-password'],
    unprefixed: true,
  },
  {
    comment: [
      '**Boards are shareable, not searchable** (P18, decision D3). They are public — a link to one',
      'works for anyone — but a board behind a gate is a thin page, and a thousand of them is the',
      'doorway-page pattern. The listing pages carry the content worth ranking, and crawl budget',
      'spent on 1,000 near-identical grids is budget not spent on them.',
    ].join('\n'),
    paths: ['/game/'],
  },
  {
    comment: 'Still behind a session.',
    paths: ['/settings', '/statistics'],
  },
  {
    comment: [
      'Authoring. Admin-only on the server, and `/levels/*` is allowed below, so these are named',
      'explicitly rather than left to be discovered and discarded.',
    ].join('\n'),
    paths: ['/levels/*/create', '/levels/*/*/edit'],
  },
]

/**
 * Written out even though nothing above disallows them, because `Allow` beats `Disallow` only when
 * it is more specific — and `/levels` sitting under the authoring rules is exactly that case.
 */
export const ROBOTS_ALLOWED_PATHS = [
  '/',
  '/about',
  '/how-to-solve',
  '/difficulties',
  '/about-project',
  '/levels',
  '/levels/',
]
