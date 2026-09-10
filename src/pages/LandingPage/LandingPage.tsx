import { BookOpenText, Play } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { useDocumentMeta } from '../../app/useDocumentMeta'
import { useAuth } from '../../app/useAuth'
import { StatusMessage } from '../../components/ui'
import styles from './LandingPage.module.css'

/**
 * The one page a stranger can read.
 *
 * Every URL on this site used to render the login form — measured 2026-09-10: `/`, `/about`,
 * `/levels` and a nonsense path all produced the same 31 words, because everything sat behind
 * `RequireSession`. Nothing was indexable and nobody could see what the game was without signing up
 * for it first.
 *
 * So this page has two jobs, and they happen to want the same thing:
 *  - tell a **person** what the game is and let them play in one tap;
 *  - give a **crawler** real prose, naming the genre people actually search for.
 *
 * Guest mode is what makes the first one possible: no account, no email, and no backend write
 * (universal rule 7). It was already built — it was just hidden behind a sign-in form.
 */

/** Where "Play now" lands: the first level of the gentlest difficulty, i.e. actually playing. */
const FIRST_LEVEL_PATH = '/game/light/1'

/** Where a player who is already signed in goes instead — their own progress, not level one. */
const PLAYER_PATH = '/levels'

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

    A stranger arriving at `/` gets the pitch and a one-tap guest start. A **player** can only get
    here through `/welcome`, deliberately — from the profile menu — because `/` is their home menu.
    They must not be offered the guest start: `loginAsGuest` would replace the account they are
    signed in to, so for them the same button goes to their levels instead.
  */
  const isPlayer = auth.isAuthenticated

  useDocumentMeta({
    title: t('CowField — a calm Star Battle puzzle'),
    description: t(
      'Play CowField, a calm Star Battle (Two Not Touch) logic puzzle. 800 hand-checked levels across four difficulties, each with exactly one solution. No account needed, no timer pressure.',
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
      navigate(FIRST_LEVEL_PATH)
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
    t('Every row, column and pen holds its exact quota of bulls.'),
    t('No two bulls may touch — not side by side, not diagonally.'),
    t('Dots are notes for yourself. They never count as bulls.'),
  ]

  const facts = [
    t('800 levels'),
    t('4 difficulties'),
    t('Exactly one solution each'),
    t('No account needed'),
  ]

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
            alternateName: 'CowField — Star Battle puzzle',
            description: t(
              'Play CowField, a calm Star Battle (Two Not Touch) logic puzzle. 800 hand-checked levels across four difficulties, each with exactly one solution. No account needed, no timer pressure.',
            ),
            genre: ['Puzzle', 'Logic puzzle', 'Star Battle'],
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
        <p className={styles.eyebrow}>{t('Star Battle logic puzzle')}</p>
        <h1 className={styles.title}>{t('CowField — a calm Star Battle puzzle')}</h1>
        <p className={styles.lead}>
          {t(
            'A grid divided into coloured pens. Place the bulls so every row, every column and every pen holds exactly its quota — and no two bulls ever touch, not side by side and not diagonally through a corner.',
          )}
        </p>

        <div className={styles.actions}>
          {isPlayer ? (
            <Link className={styles.primaryAction} to={PLAYER_PATH}>
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
              ? t('Waking the server — the first visit after a quiet spell takes a moment.')
              : t('No account, no email. Play as a guest right away.')}
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
        alt={t('A CowField board: a grid of coloured pens with bulls and dot notes placed on it.')}
      />

      <section className={styles.section} aria-labelledby="landing-rules">
        <h2 id="landing-rules" className={styles.sectionTitle}>
          {t('The rules, in three lines')}
        </h2>
        <ul className={styles.ruleList}>
          {rules.map((rule) => (
            <li key={rule} className={styles.ruleItem}>
              {rule}
            </li>
          ))}
        </ul>
        <Link className={styles.inlineLink} to="/about">
          <span className={styles.actionIcon}>
            <BookOpenText size={16} />
          </span>
          <span>{t('Read the full rules')}</span>
        </Link>
      </section>

      <section className={styles.section} aria-labelledby="landing-calm">
        <h2 id="landing-calm" className={styles.sectionTitle}>
          {t('Made to be unhurried')}
        </h2>
        <p className={styles.body}>
          {t(
            'Nothing here rushes you. A clock runs if you want to race yourself, and "take your time" switches it off entirely. A bull that breaks a rule is highlighted the moment you place it, so you can try an idea and see the answer rather than second-guessing yourself — and it only ever tells you what is illegal, never what is correct, so the puzzle stays yours to solve.',
          )}
        </p>
        <p className={styles.body}>
          {t(
            'There are 800 levels across four difficulties: light on a 6x6 grid, easy on 8x8, medium on 10x10, and hard on 10x10 with two bulls in every row, column and pen. Every board is generated and then re-checked to have exactly one solution, so a level that looks impossible can always be reasoned out. Star Battle players may know this puzzle as Two Not Touch.',
          )}
        </p>
        <ul className={styles.factList}>
          {facts.map((fact) => (
            <li key={fact} className={styles.factItem}>
              {fact}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
