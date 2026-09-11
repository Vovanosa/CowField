import { BookOpenText, Play, Rows3, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { useDocumentMeta } from '../../app/useDocumentMeta'
import { useAuth } from '../../app/useAuth'
import { StatusMessage } from '../../components/ui'
import styles from './LandingPage.module.css'

/**
 * Where both primary actions land — the guest start and a signed-in player's "back to your levels".
 *
 * "Play now" used to drop a new guest straight into `/game/light/1`. Landing on the difficulty
 * chooser instead costs one tap and shows them what they actually arrived at: five difficulties and
 * a thousand levels, which is the thing the page just spent 250 words describing. Jumping into one
 * 6x6 grid hid all of it and gave them no idea where they were or how to get anywhere else.
 */
const LEVELS_PATH = '/levels'

/** How long a start may take silently before the page explains itself. */
const SLOW_START_NOTICE_MS = 3000

export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const auth = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [isSlow, setIsSlow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /*
    Whether the reader has a session changes what this page is for, not what it says.

    A stranger arriving at `/` gets the pitch and a guest start. A **player** can only get here
    through `/welcome`, deliberately — from the profile menu — because `/` is their home menu.
    They must not be offered the guest start: `loginAsGuest` would replace the account they are
    signed in to, so for them the button skips straight to the same destination.
  */
  const isPlayer = auth.isAuthenticated

  useDocumentMeta({
    title: t('Play Star Battle online, free - CowField'),
    description: t(
      'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.',
    ),
    // This page answers on `/welcome` too, so both URLs name `/` as the one to index.
    canonicalPath: '/',
  })

  async function handlePlayNow() {
    setIsStarting(true)
    setIsSlow(false)
    setError(null)

    /*
      The API sleeps when idle and takes tens of seconds to wake, so the very first visitor of the
      day can wait a long time here for something that is working perfectly.

      Silence reads as broken and people leave, so after a few seconds the button stops saying
      "Starting..." and says what is actually happening. It is not a fix for the cold start — that is
      a hosting decision — but it is the difference between a visitor waiting and a visitor giving
      up on a game they never got to see.
    */
    const slowTimer = window.setTimeout(() => setIsSlow(true), SLOW_START_NOTICE_MS)

    try {
      await auth.loginAsGuest()
      navigate(LEVELS_PATH)
    } catch (requestError) {
      // The API can be cold or unreachable. Saying so beats a button that looks broken.
      setError(
        requestError instanceof Error
          ? t("Couldn't start a game. Check your connection and try again.")
          : t('Request failed.'),
      )
      setIsStarting(false)
      setIsSlow(false)
    } finally {
      window.clearTimeout(slowTimer)
    }
  }

  const rules = [
    t(
      'Every row, column and pen gets the same number of bulls. One on the small boards, three on the biggest.',
    ),
    t('Two bulls can never touch, including diagonally at a corner.'),
    t("Dots are your own notes. They don't count as bulls."),
  ]

  const facts = [t('1,000 levels'), t('Five difficulties'), t('Up to 15x15'), t('No sign-up')]

  return (
    <div className={`${styles.landing} page-shell page-shell-compact`}>
      {/*
        `VideoGame` structured data, on this page only rather than in `index.html`, so it describes
        the page it actually sits on. `inLanguage` lists both catalogues even though the URL does not
        yet carry the language — see decision D5 in the scope document.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: 'CowField',
            alternateName: 'CowField Star Battle',
            description: t(
              'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.',
            ),
            genre: ['Puzzle', 'Logic puzzle', 'Star Battle', 'Two Not Touch'],
            applicationCategory: 'Game',
            operatingSystem: 'Web browser',
            playMode: 'SinglePlayer',
            inLanguage: ['en', 'uk'],
            url: typeof window === 'undefined' ? undefined : window.location.origin,
            image:
              typeof window === 'undefined' ? undefined : `${window.location.origin}/og-image.png`,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />

      <section className={styles.hero}>
        <h1 className={styles.title}>{t('Star Battle, with cows')}</h1>
        <p className={styles.lead}>
          {t(
            'A grid of coloured pens. Every row, every column and every pen needs the same number of bulls, and no two bulls may touch, not even at a corner. That is the whole game. If you have played Star Battle or Two Not Touch before, you already know it.',
          )}
        </p>

        <div className={styles.actions}>
          {isPlayer ? (
            <Link className={styles.primaryAction} to={LEVELS_PATH}>
              <span className={styles.actionIcon}>
                <Play size={18} />
              </span>
              <span>{t('Back to your levels')}</span>
            </Link>
          ) : (
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => void handlePlayNow()}
              disabled={isStarting}
            >
              <span className={styles.actionIcon}>
                <Play size={18} />
              </span>
              <span>{isStarting ? t('Starting...') : t('Play now')}</span>
            </button>
          )}
          {isPlayer ? null : (
            <Link className={styles.secondaryAction} to="/login">
              {t('Sign in to save your progress')}
            </Link>
          )}
        </div>

        {/*
          One line, and which line it is depends on how long the start is taking. `aria-live` so a
          screen-reader user is told about the wait rather than left with a button that went quiet —
          `polite` because it must not interrupt, and the region is always rendered so the change is
          announced (a region that appears at the same moment its text does is often missed).

          Nothing to say to a player: there is no guest start to explain and no cold start to wait
          through, since they only got here from inside the running app.
        */}
        {isPlayer ? null : (
          <p className={styles.actionNote} aria-live="polite">
            {isSlow
              ? t('The server is waking up. First visit of the day takes a few seconds.')
              : t("You don't need an account. Click play and you're on a board.")}
          </p>
        )}

        {error ? <StatusMessage message={error} variant="warning" compact /> : null}
      </section>

      {/*
        The same file as the Open Graph image, reused rather than duplicated: it is a real screenshot
        of a real board, produced by `npm run og:image`, so it cannot drift from the product.

        `loading="lazy"` with explicit dimensions: browsers load a lazy image immediately when it is
        already in view, so this defers it only for the visitors who never scroll — and the width and
        height stop it shifting the layout either way. The hero text stays the largest paint.
      */}
      <img
        className={styles.preview}
        src="/og-image.png"
        width={1200}
        height={630}
        loading="lazy"
        decoding="async"
        alt={t('A CowField board: coloured pens with bulls and dot notes placed on them.')}
      />

      <section className={styles.section} aria-labelledby="landing-rules">
        <h2 id="landing-rules" className={styles.sectionTitle}>
          {t('How to play')}
        </h2>
        <ul className={styles.ruleList}>
          {rules.map((rule) => (
            <li key={rule} className={styles.ruleItem}>
              {rule}
            </li>
          ))}
        </ul>
        {/*
          Internal links to the two pages added in P17. They are the only route a crawler has into
          them — nothing else on the public surface points there — and they are the reason those
          pages can pick up the long-tail queries this one cannot serve on its own.
        */}
        <div className={styles.linkRow}>
          <Link className={styles.inlineLink} to="/about">
            <span className={styles.actionIcon}>
              <BookOpenText size={16} />
            </span>
            <span>{t('Read the full rules')}</span>
          </Link>
          <Link className={styles.inlineLink} to="/how-to-solve">
            <span className={styles.actionIcon}>
              <Sparkles size={16} />
            </span>
            <span>{t('Solving techniques')}</span>
          </Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="landing-calm">
        <h2 id="landing-calm" className={styles.sectionTitle}>
          {t('No timer unless you want one')}
        </h2>
        <p className={styles.body}>
          {t(
            'There is a clock if you want to race yourself, and a setting that hides it. Put a bull somewhere it breaks a rule and it lights up immediately, so you can try an idea and watch what happens. It will not tell you what is correct, only what is illegal. The solving is left to you.',
          )}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="landing-levels">
        <h2 id="landing-levels" className={styles.sectionTitle}>
          {t('1,000 levels, five board sizes')}
        </h2>
        <p className={styles.body}>
          {t(
            'Two hundred levels in each of five difficulties. Light is 6x6 with one bull per row, column and pen. Easy is 8x8, medium is 10x10, and hard is 10x10 with two. Extreme is 15x15 with three, which is a different puzzle rather than a bigger one.',
          )}
        </p>
        <p className={styles.body}>
          {t(
            'Every board is generated and then solved again to check it. Light through hard have exactly one answer, so they can always be reasoned out. Extreme boards can have a few, which is the honest trade for having 15x15 boards at all. Any arrangement that follows the rules counts as a win.',
          )}
        </p>
        <ul className={styles.factList}>
          {facts.map((fact) => (
            <li key={fact} className={styles.factItem}>
              {fact}
            </li>
          ))}
        </ul>
        <Link className={styles.inlineLink} to="/difficulties">
          <span className={styles.actionIcon}>
            <Rows3 size={16} />
          </span>
          <span>{t('Star Battle board sizes and difficulty')}</span>
        </Link>
      </section>
    </div>
  )
}
