/**
 * Does every string the UI asks for actually exist in every dictionary?
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
 * **It reads `src/languages.ts`**, so a language added there is a dictionary this expects to find
 * at `src/locales/<code>.ts` and starts checking from the next run. The cost of a language, in
 * strings, is the count this prints.
 *
 *     npm run check:locales
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { DEFAULT_LANGUAGE, supportedLanguages, type SupportedLanguage } from '../src/languages.ts'

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\//, '')

const dictionaries = new Map<SupportedLanguage, Record<string, string>>()

for (const language of supportedLanguages) {
  const module = await import(pathToFileURL(join(SRC, `locales/${language}.ts`)).href)
  dictionaries.set(language, module.default as Record<string, string>)
}

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
 * Dictionaries are compared by plural **stem**, not by key.
 *
 * i18next suffixes a counted string with the plural category of the language, and no two languages
 * need the same set: English has `_one` and `_other`, Ukrainian has `_one`, `_few` and `_many`.
 * Comparing raw keys reports all twelve of those as mismatches and reports nothing useful, which is
 * what the first version of this script did.
 */
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

const stem = (key: string) => key.replace(PLURAL_SUFFIX, '')
const stems = (keys: string[]) => new Set(keys.map(stem))

const stemsByLanguage = new Map(
  supportedLanguages.map((language) => [language, stems(Object.keys(dictionaries.get(language)!))]),
)

for (const key of used) {
  for (const language of supportedLanguages) {
    if (!stemsByLanguage.get(language)!.has(stem(key))) {
      problems.push(`MISSING from ${language}.ts   ${JSON.stringify(key).slice(0, 110)}`)
    }
  }
}

/*
  Every dictionary is compared against the default one rather than every pair against every other:
  the default is the one the keys are written in, so a disagreement anywhere is a disagreement with
  it, and N-1 comparisons say everything N² would.
*/
const fallbackStems = stemsByLanguage.get(DEFAULT_LANGUAGE)!

for (const language of supportedLanguages) {
  if (language === DEFAULT_LANGUAGE) continue

  const theirs = stemsByLanguage.get(language)!

  for (const key of fallbackStems) {
    if (!theirs.has(key)) {
      problems.push(
        `in ${DEFAULT_LANGUAGE}.ts, not in ${language}.ts  ${JSON.stringify(key).slice(0, 110)}`,
      )
    }
  }
  for (const key of theirs) {
    if (!fallbackStems.has(key)) {
      problems.push(
        `in ${language}.ts, not in ${DEFAULT_LANGUAGE}.ts  ${JSON.stringify(key).slice(0, 110)}`,
      )
    }
  }
}

/**
 * The plural categories a language can actually reach with a whole number.
 *
 * Not `Intl.PluralRules(...).resolvedOptions().pluralCategories`, which lists the categories the
 * language *has*: Ukrainian's `other` is reached only by fractions, and nothing in this app counts
 * halves of a level. Selecting over the integers gives the set a translator has to cover — `one`
 * and `other` for English, `one`, `few` and `many` for Ukrainian and for Polish.
 */
function integerPluralCategories(language: SupportedLanguage) {
  const rules = new Intl.PluralRules(language)
  const categories = new Set<string>()

  for (let count = 0; count <= 200; count += 1) {
    categories.add(rules.select(count))
  }

  return [...categories]
}

/*
  A counted string needs **all** of its language's integer categories, or one branch of the count
  renders the raw key — and only for the counts that hit that branch, which is how a missing `_few`
  survives testing.

  The trigger is the dictionary declaring *any* plural form for a stem, not the default language
  declaring one. A translation is free to write the count out of the sentence instead: `uk.ts`
  does exactly that for the solver's "Found N solutions" ("Знайдено розв'язків: {{count}}"), where
  the number lands after a colon and the noun never changes shape. That is a correct translation,
  not a gap, and i18next falls back to the base key for it.
*/
for (const language of supportedLanguages) {
  const dictionary = dictionaries.get(language)!
  const required = integerPluralCategories(language)
  const pluralStems = new Set(
    Object.keys(dictionary)
      .filter((key) => PLURAL_SUFFIX.test(key))
      .map(stem),
  )

  for (const base of pluralStems) {
    for (const category of required) {
      if (!(`${base}_${category}` in dictionary)) {
        problems.push(
          `${language}.ts has no _${category} form of  ${JSON.stringify(base).slice(0, 100)}`,
        )
      }
    }
  }
}

// Unused keys are not a failure — plenty are reached through variables — but they are worth seeing.
const fallbackDictionary = dictionaries.get(DEFAULT_LANGUAGE)!
const unused = Object.keys(fallbackDictionary).filter(
  (key) => !used.has(key) && !PLURAL_SUFFIX.test(key) && key.length > 40,
)

console.log(
  `${used.size} literal keys used; ` +
    supportedLanguages
      .map((language) => `${Object.keys(dictionaries.get(language)!).length} in ${language}.ts`)
      .join(', ') +
    '\n',
)

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

console.log(
  `ALL PASS — every literal key exists in all ${supportedLanguages.length} dictionaries, and they agree\n`,
)
