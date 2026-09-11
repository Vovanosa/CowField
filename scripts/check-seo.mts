/**
 * Asserts the things that make this site findable, against a running deployment.
 *
 * **Why a script and not a checklist.** Every item in P14 is invisible from inside the app: a
 * missing description, a `robots.txt` served as HTML, a title that is the same on four different
 * URLs. All of it was measured once on 2026-09-10 and all of it can silently come back — a route
 * added without `useDocumentMeta`, a rewrite that swallows `sitemap.xml` again, a domain change that
 * leaves the sitemap pointing at the old host. This turns that measurement into something that fails.
 *
 * Runs a real rendering pass in headless Chrome (crawlers execute JavaScript, so a `fetch` of the
 * HTML would test the wrong thing) plus plain requests for the status codes and content types.
 * No dependency: Node 22's global `WebSocket` is all the DevTools Protocol needs.
 *
 * **Against a local build:**
 *   npm run build && npm run preview
 *   npm run check:seo -- --url=http://localhost:4173
 *
 * **Against production:**
 *   npm run check:seo -- --url=https://cowfield.vercel.app
 *
 * PowerShell eats `--` in `npm run x -- --flag`; use `A11Y_APP_URL=... npm run check:seo` or call
 * `npx tsx scripts/check-seo.mts --url=…` directly there.
 *
 * **Since P18 this needs the API running.** Six of the ten indexable pages are `/levels` and the five
 * `/levels/:difficulty` pages, and their content is the level grid — which comes from
 * `GET /api/levels/...`. Those reads are public now, so no session is needed, but a check run with
 * the API down reports thin pages rather than a broken server, which is the wrong diagnosis.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const urlArgument = process.argv.find((argument) => argument.startsWith('--url='))
const TARGET = (urlArgument?.slice('--url='.length) ?? process.env.A11Y_APP_URL ?? 'http://localhost:4173')
  .replace(/\/+$/, '')
const DEBUG_PORT = Number(process.env.A11Y_DEBUG_PORT ?? 9224)

/**
 * The pages that must be indexable, written **language-neutral**. Each one exists twice since P18 —
 * once at the root in English, once under `/uk` — and both halves are checked.
 *
 * `/` must stay first: the landing-page word-count and structured-data assertions read the first
 * entry.
 */
const PUBLIC_PATHS = [
  '/',
  '/levels',
  '/about',
  '/how-to-solve',
  '/levels/light',
  '/levels/easy',
  '/levels/medium',
  '/levels/hard',
  '/levels/extreme',
  '/difficulties',
]

/** Where a language-neutral path lives in the Ukrainian tree. `/` is `/uk`, not `/uk/`. */
function ukPath(path: string) {
  return path === '/' ? '/uk' : `/uk${path}`
}

const PUBLIC_ROUTES = [...PUBLIC_PATHS, ...PUBLIC_PATHS.map(ukPath)]

/**
 * Needs a session, is a credential form, or is deliberately not searchable: must report `noindex`.
 *
 * `/game/*` is the interesting one. It is **public** since P18 — a link to a board works for anyone —
 * but a board behind a gate is a thin page and a thousand of them is the doorway-page pattern
 * (decision D3). Shareable, not searchable, and this is what keeps the two apart.
 */
const PRIVATE_ROUTES = ['/settings', '/login', '/game/light/1', '/uk/settings', '/uk/game/light/1']
/** The landing page's second URL, for players who cannot reach it at `/`. Must canonicalise to `/`. */
const ALIAS_ROUTE = '/welcome'
/** Must not resolve to the app at all. */
const UNKNOWN_ROUTE = '/this-page-does-not-exist-seo-check'

const MINIMUM_LANDING_WORDS = 150

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((path): path is string => Boolean(path))

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let failures = 0
let checks = 0

function check(label: string, ok: boolean, detail = '') {
  checks += 1
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `\n        ${detail}` : ''}`)
}

/**
 * Not every check can pass against `vite preview`, and reporting those as failures would train
 * everyone to ignore the output.
 *
 * Two things are true only of the real deployment:
 *  - **absolute URLs.** `robots.txt`, `sitemap.xml` and `og:image` have to carry a host, and it is
 *    the production one. Checked for *self-consistency* everywhere, and against the target only when
 *    the target is that host.
 *  - **404s.** They come from the narrowed rewrites in `vercel.json`; `vite preview` applies SPA
 *    fallback and answers 200 for everything, so this can only be verified on Vercel.
 */
const IS_DEPLOYMENT = TARGET.startsWith('https://')

function deploymentOnly(label: string, ok: boolean, detail = '') {
  if (IS_DEPLOYMENT) {
    check(label, ok, detail)
    return
  }

  console.log(`SKIP  ${label}\n        only verifiable against the deployment; run with --url=https://…`)
}

try {
  await fetch(TARGET)
} catch {
  console.error(`\n${TARGET} is not reachable.\n  Local: npm run build && npm run preview\n`)
  process.exit(2)
}

console.log(`Checking ${TARGET}\n`)

// ------------------------------------------------- files and status codes

console.log('--- what the edge serves ---')

async function head(path: string) {
  const response = await fetch(`${TARGET}${path}`, { redirect: 'manual' })
  return {
    status: response.status,
    type: (response.headers.get('content-type') ?? '').split(';')[0].trim(),
    body: await response.text(),
  }
}

const robots = await head('/robots.txt')
/** The host the static files commit to. Content is checked against this; identity against TARGET. */
const declaredOrigin = robots.body.match(/Sitemap:\s*(https?:\/\/[^\s/]+)/)?.[1] ?? TARGET

check(
  'robots.txt is served as text, not as the app',
  robots.status === 200 && robots.type === 'text/plain',
  `${robots.status} ${robots.type}`,
)
check(
  'robots.txt points at the sitemap and disallows the private surface',
  robots.body.includes('Sitemap:') && robots.body.includes('Disallow: /login'),
)
deploymentOnly(
  'robots.txt sitemap URL matches the host being checked',
  robots.body.includes(`${TARGET}/sitemap.xml`),
  // A domain move has to update robots.txt, sitemap.xml and the og:image URL together.
  `declares ${declaredOrigin}, checking ${TARGET}`,
)

const sitemap = await head('/sitemap.xml')
check(
  'sitemap.xml is served as XML',
  sitemap.status === 200 && /xml/.test(sitemap.type),
  `${sitemap.status} ${sitemap.type}`,
)
/*
  Parsed out of `<loc>` rather than matched against the whole file. The sitemap carries a comment
  explaining why boards are absent, and that comment necessarily contains the string `/game/` — so a
  naive `body.includes` test fails on its own documentation.
*/
const sitemapLocations = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

check(
  'sitemap lists every public route, in both languages',
  PUBLIC_ROUTES.every((route) =>
    sitemapLocations.includes(`${declaredOrigin}${route === '/' ? '/' : route}`),
  ),
  `${sitemapLocations.length} URLs, relative to the origin the sitemap declares: ${declaredOrigin}`,
)
check(
  'and nothing that needs a session or is deliberately unsearchable',
  !sitemapLocations.some((location) => /\/game\/|\/settings|\/statistics|\/login/.test(location)),
  sitemapLocations.filter((location) => /\/game\/|\/settings|\/statistics/.test(location)).join(', '),
)

const unknown = await head(UNKNOWN_ROUTE)
deploymentOnly(
  'an unknown URL does not return 200 with the app',
  unknown.status === 404,
  `${unknown.status} — a 200 here is an unbounded supply of soft-404s`,
)

const ogImage = await head('/og-image.png')
check(
  'the Open Graph image exists',
  ogImage.status === 200 && ogImage.type === 'image/png',
  `${ogImage.status} ${ogImage.type}`,
)

// ---------------------------------------------------- the rendered pages

const chromePath = CHROME_CANDIDATES.find((path) => existsSync(path))

if (!chromePath) {
  console.error('\nNo Chrome or Edge found. Set CHROME_PATH to the executable.\n')
  process.exit(2)
}

const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cowfield-seo-'))}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
  ],
  { stdio: 'ignore' },
)

async function pageTargetUrl() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)
      const targets = (await response.json()) as { type: string; webSocketDebuggerUrl?: string }[]
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* still starting */
    }
    await sleep(200)
  }
  throw new Error('Chrome never exposed a page target')
}

const socket = new WebSocket(await pageTargetUrl())
await new Promise<void>((resolve, reject) => {
  socket.addEventListener('open', () => resolve(), { once: true })
  socket.addEventListener('error', () => reject(new Error('CDP socket failed')), { once: true })
})

let nextId = 1
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (e: Error) => void }>()
const waiters: { method: string; resolve: () => void }[] = []

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data)) as {
    id?: number
    method?: string
    error?: unknown
    result?: unknown
  }

  if (message.id && pending.has(message.id)) {
    const entry = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) entry?.reject(new Error(JSON.stringify(message.error)))
    else entry?.resolve(message.result)
    return
  }

  if (message.method) {
    for (let index = waiters.length - 1; index >= 0; index -= 1) {
      if (waiters[index].method === message.method) waiters.splice(index, 1)[0].resolve()
    }
  }
})

function send(method: string, params: Record<string, unknown> = {}) {
  const id = nextId
  nextId += 1
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise<Record<string, unknown>>((resolve, reject) =>
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject }),
  )
}

function waitForEvent(method: string, timeoutMs = 25000) {
  return new Promise<void>((resolve, reject) => {
    waiters.push({ method, resolve })
    setTimeout(() => reject(new Error(`timed out waiting for ${method}`)), timeoutMs)
  })
}

async function evaluate<T>(body: string) {
  const result = (await send('Runtime.evaluate', {
    expression: `(() => { ${body} })()`,
    returnByValue: true,
    awaitPromise: true,
  })) as { result?: { value?: T }; exceptionDetails?: { exception?: { description?: string } } }

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'page threw')
  }

  return result.result?.value as T
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})

type PageFacts = {
  path: string
  title: string
  description: string | null
  robots: string | null
  canonical: string | null
  ogImage: string | null
  jsonLd: number
  h1: string[]
  words: number
  /** hreflang → href, from the `<link rel="alternate">` set `useDocumentMeta` emits. */
  alternates: Record<string, string>
  /**
   * Paragraphs carrying a real sentence, not a label.
   *
   * A word count cannot tell a listing page apart from a thin one: 200 level numbers are 200
   * "words", so a page that lost all its copy would still look substantial. Counting paragraphs long
   * enough to be prose is what actually distinguishes them.
   */
  proseParagraphs: number
}

const PROBE = `
  const meta = (selector) => document.querySelector(selector)?.getAttribute('content') || null
  const text = (document.querySelector('#root')?.innerText || '').replace(/\\s+/g, ' ').trim()
  return {
    path: location.pathname,
    title: document.title,
    description: meta('meta[name="description"]'),
    robots: meta('meta[name="robots"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
    ogImage: meta('meta[property="og:image"]'),
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    h1: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent.trim()),
    words: text ? text.split(' ').length : 0,
    alternates: Object.fromEntries(
      Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((link) => [
        link.getAttribute('hreflang'),
        link.getAttribute('href'),
      ]),
    ),
    proseParagraphs: Array.from(document.querySelectorAll('#root p')).filter(
      (paragraph) => (paragraph.textContent || '').trim().length > 80,
    ).length,
  }
`

async function inspect(path: string): Promise<PageFacts> {
  const loaded = waitForEvent('Page.loadEventFired')
  await send('Page.navigate', { url: `${TARGET}${path}` })
  await loaded
  // Long enough for the router to settle, the lazy chunk to arrive and the meta effect to run.
  await sleep(2000)
  return evaluate<PageFacts>(PROBE)
}

console.log('\n--- the public pages ---')

const publicFacts: PageFacts[] = []
const factsByRoute = new Map<string, PageFacts>()

for (const route of PUBLIC_ROUTES) {
  const facts = await inspect(route)
  publicFacts.push(facts)
  factsByRoute.set(route, facts)

  check(
    `${route} stays on its own URL instead of redirecting to a login form`,
    facts.path === route,
    `ended up at ${facts.path}`,
  )
  check(`${route} has a title naming the product`, /CowField/.test(facts.title), `"${facts.title}"`)
  check(
    `${route} has a description`,
    Boolean(facts.description && facts.description.length > 50),
    facts.description ? `${facts.description.length} chars` : 'missing',
  )
  check(
    `${route} is indexable`,
    facts.robots === null || facts.robots.startsWith('index'),
    `robots=${facts.robots}`,
  )
  check(
    `${route} declares a canonical URL for itself`,
    facts.canonical === `${TARGET}${route === '/' ? '/' : route}`,
    `canonical=${facts.canonical}`,
  )
  check(
    `${route} has exactly one h1`,
    facts.h1.length === 1,
    facts.h1.length ? `["${facts.h1.join('", "')}"]` : 'none',
  )
  check(
    `${route} points at an absolute Open Graph image`,
    Boolean(facts.ogImage?.startsWith('http')),
    `og:image=${facts.ogImage}`,
  )
}

/*
  The six pages P18 added to the index are `/levels` and the five `/levels/:difficulty`, in both
  languages. Their grid is genuine content, but a grid alone is a doorway page — the copy is what
  makes them worth ranking, and it is the part that can silently go missing (a locale key renamed, a
  component refactored, a difficulty added without its entry in `difficultyPageContent`).
*/
const DIFFICULTY_PAGE_PATTERN = /\/levels\/[a-z]+$/

for (const route of PUBLIC_ROUTES.filter((candidate) => DIFFICULTY_PAGE_PATTERN.test(candidate))) {
  const facts = factsByRoute.get(route)
  check(
    `${route} carries real copy, not just a grid of numbers`,
    (facts?.proseParagraphs ?? 0) >= 2,
    `${facts?.proseParagraphs ?? 0} paragraph(s) over 80 characters`,
  )
}

const [landing] = publicFacts
check(
  `the landing page renders more than ${MINIMUM_LANDING_WORDS} words of real content`,
  landing.words > MINIMUM_LANDING_WORDS,
  `${landing.words} words (it was 31 for the whole site on 2026-09-10)`,
)
check(
  'the landing page carries structured data',
  landing.jsonLd >= 1,
  `${landing.jsonLd} ld+json block(s)`,
)
check(
  'the public pages do not share one title',
  new Set(publicFacts.map((facts) => facts.title)).size === publicFacts.length,
  `${new Set(publicFacts.map((facts) => facts.title)).size} distinct titles across ${publicFacts.length} pages`,
)

/*
  ---------------------------------------------------------------- P18, D-3

  **Two assertions, because both failure modes are completely silent.**

  A one-way `hreflang` is ignored: if `/about` claims `/uk/about` and that page does not claim
  `/about` back, Google drops the relationship with no warning in Search Console and no error
  anywhere. And a Ukrainian page that canonicalises to its English counterpart is not a small bug —
  it is an instruction to drop every Ukrainian URL on the site, which is the entire asset this
  programme built.

  Neither can be caught by reading the code, because the tags are produced by an effect at runtime
  and the sitemap is generated separately. They have to be read off the rendered page.
*/
console.log('\n--- the two languages declare each other ---')

for (const path of PUBLIC_PATHS) {
  const english = factsByRoute.get(path)
  const ukrainian = factsByRoute.get(ukPath(path))

  if (!english || !ukrainian) {
    check(`${path} was inspected in both languages`, false)
    continue
  }

  check(
    `${path} and ${ukPath(path)} declare each other (hreflang is reciprocal)`,
    english.alternates.uk === `${TARGET}${ukPath(path)}` &&
      english.alternates.en === `${TARGET}${path}` &&
      ukrainian.alternates.en === `${TARGET}${path}` &&
      ukrainian.alternates.uk === `${TARGET}${ukPath(path)}`,
    `en→${english.alternates.uk} | uk→${ukrainian.alternates.en}`,
  )
  check(
    `${ukPath(path)} canonicalises to itself, not to ${path}`,
    ukrainian.canonical === `${TARGET}${ukPath(path)}`,
    `canonical=${ukrainian.canonical}`,
  )
  check(
    `${path} and ${ukPath(path)} say different things`,
    english.title !== ukrainian.title,
    `"${english.title}" vs "${ukrainian.title}"`,
  )
  check(
    `x-default points at the English ${path}`,
    english.alternates['x-default'] === `${TARGET}${path}` &&
      ukrainian.alternates['x-default'] === `${TARGET}${path}`,
    `${english.alternates['x-default']} / ${ukrainian.alternates['x-default']}`,
  )
}

/*
  `/welcome` is the same page as `/`, on a URL a signed-in player can reach — `/` is their home
  menu, so without this the landing page was unreachable from inside the app.

  It is the one page in the site served on two URLs, which is the thing this whole script exists to
  catch, so it is checked rather than trusted: it must render the landing page, and it must hand `/`
  the credit for it. A self-canonical here would be two pages competing for the same words.
*/
console.log('\n--- the landing page on its second URL ---')

const welcome = await inspect(ALIAS_ROUTE)
check(`${ALIAS_ROUTE} renders the landing page`, welcome.words > MINIMUM_LANDING_WORDS, `${welcome.words} words`)
check(
  `${ALIAS_ROUTE} gives / the canonical rather than claiming it`,
  welcome.canonical === `${TARGET}/`,
  `canonical=${welcome.canonical}`,
)
check(
  `${ALIAS_ROUTE} is not listed in the sitemap`,
  !sitemap.body.includes(`${declaredOrigin}${ALIAS_ROUTE}`),
)

console.log('\n--- the pages that must stay out of the index ---')

for (const route of PRIVATE_ROUTES) {
  const facts = await inspect(route)
  check(
    `${route} reports noindex`,
    facts.robots?.startsWith('noindex') === true,
    `robots=${facts.robots} (at ${facts.path})`,
  )
}

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} — ${checks} checks`)

socket.close()
chrome.kill()
process.exit(failures === 0 ? 0 : 1)
