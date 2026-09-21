/**
 * Does every string the UI asks for actually exist in both dictionaries?
 *
 * **Rule 9 says every new string goes in `en.ts` and `uk.ts`, and nothing enforced it.** i18next
 * fails silently and usefully: a missing key renders as the key, which in this project *is* the
 * English text. So a key that never reached `en.ts` looks perfect in English and shows English to a
 * Ukrainian reader, and a key left behind after a rewrite sits in the file forever costing bytes.
 * Neither shows up in `tsc`, in `eslint`, or on the page in the language you happen to be testing.
 *
 * Found on 2026-09-21 during the copy pass: one key in `en.ts` was written with an escaped
 * apostrophe (`row\'s` inside a single-quoted string) where `uk.ts` used double quotes, so a
 * literal find-and-replace updated one file and not the other. English still rendered correctly —
 * by falling back to the key — which is exactly the kind of silence this exists to break.
 *
 *     npm run check:locales
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\//, '')

const en: Record<string, string> = (
  await import(pathToFileURL(join(SRC, 'locales/en.ts')).href)
).default
const uk: Record<string, string> = (
  await import(pathToFileURL(join(SRC, 'locales/uk.ts')).href)
).default

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

/**
 * Every `t('...')` and `t("...")` with a literal first argument, plus the `difficultyPageContent`
 * strings, which reach `t()` through a variable and so cannot be matched at the call site.
 *
 * A `t(someVariable)` is invisible here and always will be. That is a real limit, stated rather
 * than papered over: this check proves the literals, not the whole surface.
 */
function collectKeys(): Set<string> {
  const keys = new Set<string>()
  const files = walk(SRC).filter((file) => !file.includes('locales'))

  for (const file of files) {
    const source = readFileSync(file, 'utf8')

    for (const match of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      keys.add(match[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'))
    }
    for (const match of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) {
      keys.add(match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'))
    }
  }

  // The per-difficulty pages hold their copy in a table and pass it through `t(content.title)`.
  const content = readFileSync(join(SRC, 'pages/DifficultyLevelsPage/difficultyPageContent.ts'), 'utf8')
  for (const match of content.matchAll(/^\s+(?:title|description):?\s*\n?\s*'((?:[^'\\]|\\.)*)',?$/gm)) {
    keys.add(match[1].replace(/\\'/g, "'"))
  }
  for (const match of content.matchAll(/^\s+'((?:[^'\\]|\\.)*)',$/gm)) {
    keys.add(match[1].replace(/\\'/g, "'"))
  }

  return keys
}

const used = collectKeys()
const problems: string[] = []

/**
 * The two files are compared by plural **stem**, not by key.
 *
 * i18next suffixes a counted string with the plural category of the language, and the two languages
 * do not have the same categories: English needs `_one` and `_other`, Ukrainian needs `_one`,
 * `_few` and `_many`. Comparing raw keys reports all twelve of those as mismatches and reports
 * nothing useful, which is what the first version of this script did.
 */
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

const stem = (key: string) => key.replace(PLURAL_SUFFIX, '')
const stems = (keys: string[]) => new Set(keys.map(stem))

const enStems = stems(Object.keys(en))
const ukStems = stems(Object.keys(uk))

for (const key of used) {
  if (!enStems.has(stem(key))) {
    problems.push(`MISSING from en.ts   ${JSON.stringify(key).slice(0, 110)}`)
  }
  if (!ukStems.has(stem(key))) {
    problems.push(`MISSING from uk.ts   ${JSON.stringify(key).slice(0, 110)}`)
  }
}

for (const key of enStems) {
  if (!ukStems.has(key)) problems.push(`in en.ts, not in uk.ts  ${JSON.stringify(key).slice(0, 110)}`)
}
for (const key of ukStems) {
  if (!enStems.has(key)) problems.push(`in uk.ts, not in en.ts  ${JSON.stringify(key).slice(0, 110)}`)
}

// A counted string still needs both of English's own categories, or one branch renders the key.
for (const key of Object.keys(en)) {
  if (!PLURAL_SUFFIX.test(key)) continue
  const base = stem(key)
  for (const required of ['_one', '_other']) {
    if (!(`${base}${required}` in en)) {
      problems.push(`en.ts has no ${required} form of  ${JSON.stringify(base).slice(0, 100)}`)
    }
  }
}

// Unused keys are not a failure — plenty are reached through variables — but they are worth seeing.
const unused = Object.keys(en).filter(
  (key) => !used.has(key) && !/_one$|_other$/.test(key) && key.length > 40,
)

console.log(`${used.size} literal keys used, ${Object.keys(en).length} in en.ts, ${Object.keys(uk).length} in uk.ts\n`)

if (unused.length) {
  console.log(`${unused.length} long keys not found at any literal call site (may be reached by variable):`)
  for (const key of unused) console.log(`  · ${key.slice(0, 100)}${key.length > 100 ? '...' : ''}`)
  console.log()
}

if (problems.length) {
  for (const problem of problems) console.log(`FAIL  ${problem}`)
  console.log(`\n${problems.length} problems\n`)
  process.exit(1)
}

console.log('ALL PASS — every literal key exists in both dictionaries, and the two agree\n')
