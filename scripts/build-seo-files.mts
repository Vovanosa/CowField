/**
 * Writes `public/sitemap.xml` and `public/robots.txt` from the language table and the public-page
 * list, so that adding a language is a row in `src/languages.ts` and not a morning of XML.
 *
 * **Why these files are generated now.** They were hand-written, and the hand-written versions were
 * already 22 `<url>` blocks and 30 `Disallow` lines for *two* languages — every page repeated once
 * per language, every page carrying an `hreflang` link per language, so the work grows with the
 * square of the table. A one-way `hreflang` is ignored silently, with no warning in Search Console
 * and no error anywhere, which makes this exactly the wrong thing to keep doing by hand.
 *
 * **Write them:**   npm run seo:files
 * **Check them:**   npm run check:seo-files   (fails if what is on disk is not what this produces)
 *
 * The two files stay committed rather than being built on deploy: Vercel serves `public/` from the
 * filesystem before it looks at `vercel.json`, and a crawler reading a file that only exists after
 * a successful build is a failure mode nobody would notice.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DEFAULT_LANGUAGE, localizePath, supportedLanguages } from '../src/languages.ts'
import { PUBLIC_PAGES, ROBOTS_ALLOWED_PATHS, ROBOTS_GROUPS } from './publicPages.ts'

/**
 * A sitemap has to carry absolute URLs, so the domain is written down. **If the site moves to a
 * custom domain, this constant, the `og:image` URL in `index.html` and Search Console all change
 * together** — `npm run check:seo` compares the sitemap against the URL it is pointed at, so it
 * fails rather than letting them drift silently.
 */
const SITE_ORIGIN = 'https://cowfield.vercel.app'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const url = (path: string, language: (typeof supportedLanguages)[number]) =>
  `${SITE_ORIGIN}${localizePath(path, language)}`

/** The `hreflang` set for one page: every language, plus `x-default`. Identical on all of its URLs. */
function alternates(path: string) {
  const links = supportedLanguages.map(
    (language) =>
      `    <xhtml:link rel="alternate" hreflang="${language}" href="${url(path, language)}" />`,
  )

  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(path, DEFAULT_LANGUAGE)}" />`,
  )

  return links.join('\n')
}

function buildSitemap() {
  const entries = PUBLIC_PAGES.flatMap((page) =>
    supportedLanguages.map((language) =>
      [
        '  <url>',
        `    <loc>${url(page.path, language)}</loc>`,
        alternates(page.path),
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  **GENERATED — do not edit by hand.**  npm run seo:files

  Source of truth: \`scripts/publicPages.ts\` for the pages, \`src/languages.ts\` for the languages.
  \`npm run check:seo-files\` fails if this file has drifted from them.

  **${entries.length} URLs: ${PUBLIC_PAGES.length} pages in ${supportedLanguages.length} languages.**

  Every entry carries the full \`hreflang\` set as \`xhtml:link\` alternates, and that is the point of
  doing it here rather than trusting the tags \`useDocumentMeta\` injects. Those tags are written by
  JavaScript; these are in a static file a crawler reads before it renders anything. It is the one
  place the non-English half of the site can be declared without depending on a render pass.

  Every URL of a page declares every other, and \`x-default\` points at ${DEFAULT_LANGUAGE.toUpperCase()}. A one-way
  \`hreflang\` is ignored silently, which is why \`npm run check:seo\` asserts reciprocity rather than
  leaving it to review.

  **Boards are not listed, deliberately** (P18, decision D3). All 1,000 are public and shareable; a
  blurred board behind a gate is a thin page and a thousand of them is the doorway-page pattern. The
  listing pages carry the content worth ranking, and \`robots.txt\` disallows \`/game/\` to match.
-->
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join('\n')}
</urlset>
`
}

/** `# ` in front of every line, so a multi-line reason stays a comment. */
const comment = (text: string) =>
  text
    .split('\n')
    .map((line) => (line ? `# ${line}` : '#'))
    .join('\n')

function buildRobots() {
  const groups = ROBOTS_GROUPS.map((group) =>
    [
      comment(group.comment),
      ...group.paths.flatMap((path) =>
        group.unprefixed
          ? [`Disallow: ${path}`]
          : supportedLanguages.map((language) => `Disallow: ${localizePath(path, language)}`),
      ),
    ].join('\n'),
  )

  const allowed = ROBOTS_ALLOWED_PATHS.flatMap((path) =>
    supportedLanguages.map((language) => `Allow: ${localizePath(path, language)}`),
  )

  return `${comment(`CowField — ${SITE_ORIGIN}

**GENERATED — do not edit by hand.**  npm run seo:files

Source of truth: \`scripts/publicPages.ts\` for the rules, \`src/languages.ts\` for the languages.
\`npm run check:seo-files\` fails if this file has drifted from them.

A static file in \`public/\` on purpose. Vercel checks the filesystem before it applies the rewrites
in \`vercel.json\`, and until this file existed the \`/(.*)\` catch-all answered /robots.txt with the
app's HTML — measured 2026-09-10: 200, text/html.

Every rule is written once and repeated per language, because a rule that covers one language
leaves the rest of the site either uncrawlable or uncontrolled, and neither failure announces
itself.`)}

User-agent: *

${groups.join('\n\n')}

${allowed.join('\n')}

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
}

const FILES = [
  { name: 'sitemap.xml', contents: buildSitemap() },
  { name: 'robots.txt', contents: buildRobots() },
]

const isCheck = process.argv.includes('--check')
let stale = 0

for (const file of FILES) {
  const path = join(PUBLIC_DIR, file.name)

  if (isCheck) {
    const onDisk = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')

    if (onDisk === file.contents) {
      console.log(`PASS  public/${file.name} is up to date`)
    } else {
      stale += 1
      console.log(`FAIL  public/${file.name} does not match — run \`npm run seo:files\``)
    }

    continue
  }

  writeFileSync(path, file.contents)
  console.log(`wrote public/${file.name}`)
}

if (isCheck) {
  console.log(
    stale
      ? `\n${stale} file(s) stale\n`
      : `\nALL PASS — the crawler-facing files match the language table\n`,
  )
  process.exit(stale ? 1 : 0)
}
