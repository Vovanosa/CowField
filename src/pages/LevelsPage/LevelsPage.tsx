import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Link } from '../../app/navigation'
import { useAuth } from '../../app/useAuth'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { EmptyState } from '../../components/EmptyState'
import { Button, PageHeader } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getDifficultyOverview } from '../../game/storage/resources'
import { DIFFICULTIES } from '../../game/storage/levelStorage'
import type { Difficulty } from '../../game/types'
import styles from './LevelsPage.module.css'

const difficultyChipClassNames: Record<Difficulty, string> = {
  light: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipLight}`,
  easy: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipEasy}`,
  medium: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipMedium}`,
  hard: styles.difficultyLinkChip,
  extreme: `${styles.difficultyLinkChip} ${styles.difficultyLinkChipExtreme}`,
}

type DifficultyProgressSummary = {
  completed: number
  total: number
}

const emptyProgressSummary: DifficultyProgressSummary = {
  completed: 0,
  total: 0,
}

/**
 * The share of a difficulty that is finished, 0–100. Drives both the bar's width and the "38% done"
 * label beside the heading.
 *
 * Derived rather than stored on the summary, which is what it used to be: one number in two places
 * that could disagree is worse than one function called twice.
 *
 * Guarding the divide matters — a difficulty with no levels yet is a real state (`totalCount` comes
 * from the database), and `0/0` is `NaN`, which CSS silently drops.
 */
function toCompletedShare({ completed, total }: DifficultyProgressSummary) {
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

/**
 * A summary for every difficulty this page renders, whatever the API sent.
 *
 * The page always draws a tile per difficulty, but the record used to be built purely from the
 * response — so a response missing one (a difficulty with no levels, a partial read) left `summary`
 * undefined and the very next line, which read a field off it, threw and took the whole page down
 * with it.
 */
function createProgressSummaryRecord() {
  return Object.fromEntries(
    DIFFICULTIES.map((difficulty) => [difficulty, emptyProgressSummary]),
  ) as Record<Difficulty, DifficultyProgressSummary>
}

export function LevelsPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  /*
    **Indexable since P18 (D-1).** This is the hub the five difficulty pages hang off, and the only
    page on the site that names all five sizes in one place. It was `noindex` for the same reason
    everything else was: it needed a session, so a crawler only ever saw it redirect to a login form.
  */
  useDocumentMeta({
    title: brandedTitle(t('Star Battle puzzles by board size')),
    description: t(
      '1,000 free Star Battle puzzles across five board sizes, from 6x6 with one star to 15x15 with three. Pick a size and start, no account needed.',
    ),
  })
  const [progressByDifficulty, setProgressByDifficulty] = useState<
    Record<Difficulty, DifficultyProgressSummary>
  >(createProgressSummaryRecord)
  const [isLoading, setIsLoading] = useState(true)
  // A flag, not a message: translating at render time means the error re-reads in the new
  // language when the player switches it, and keeps `t` out of the effect's dependencies.
  const [hasLoadError, setHasLoadError] = useState(false)
  // Bumping this re-runs the load effect, which is all "Try again" needs to do — the overview cache
  // is only written on success, so a retry really does re-request.
  const [reloadKey, setReloadKey] = useState(0)
  // Only once the retry has finished failing: while a retry is in flight the page shows its
  // skeletons again rather than a stale error next to a dead button.
  const showLoadError = hasLoadError && !isLoading

  useEffect(() => {
    let isActive = true

    async function loadDifficultyProgress() {
      try {
        const overview = await getDifficultyOverview()
        const nextProgress = createProgressSummaryRecord()

        for (const item of overview.difficulties) {
          nextProgress[item.difficulty] = {
            completed: item.completedCount,
            total: item.totalCount,
          }
        }

        if (!isActive) {
          return
        }

        setProgressByDifficulty(nextProgress)
        setHasLoadError(false)
      } catch (error) {
        reportUnexpectedError(error, 'levels overview')

        if (isActive) {
          setHasLoadError(true)
        }
      } finally {
        // `finally`, not the success path: without it a failed request left the skeletons up
        // permanently and reported nothing.
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadDifficultyProgress()

    return () => {
      isActive = false
    }
  }, [reloadKey])

  return (
    <div className={`${styles.levelsPage} page-shell`}>
      {/*
        **The heading says what the page is for, not what it ranks for.** The query-first phrase lives
        in the `<title>` and the meta description, where it is what a search result shows; on the page
        itself a player wants "choose a difficulty", and the five chips are the content either way.
        Same correction as the difficulty pages: the functional reading comes first.
      */}
      <PageHeader
        titleAs="h1"
        backTo="/"
        backLabel={t('Back to home')}
        title={t('Choose a difficulty to play.')}
      />

      {showLoadError ? (
        <EmptyState
          message={t("Couldn't load your progress. Check your connection and try again.")}
          actions={
            <Button variant="primary" onClick={() => setReloadKey((key) => key + 1)}>
              {t('Try again')}
            </Button>
          }
        />
      ) : (
        <section className={styles.levelsGrid} aria-label={t('Available levels')}>
          {DIFFICULTIES.map((difficulty) => {
            const summary = progressByDifficulty[difficulty]

            return (
              <Link
                key={difficulty}
                className={difficultyChipClassNames[difficulty]}
                to={`/levels/${difficulty}`}
                aria-busy={isLoading}
              >
                {/*
                  **The chip is back to what it was**, minus the wording (P18, decision D10 as
                  amended twice).

                  The first pass replaced the percentage, the `76/200 completed` line and the filled
                  bar with a single count, on the argument that three renderings of one number is two
                  too many. That was wrong in practice: each one is read differently — the percentage
                  is the number you compare between difficulties, the count is the one you compare
                  with yourself, and the bar is the one you do not read at all. What actually changed
                  for the better was the wording, and that stays: "47 of 200 solved" rather than
                  "47/200 completed".

                  A visitor with no session gets the level total and neither of the other two. An
                  empty bar and a "0% done" read as things you are behind on, which is the wrong
                  first impression of a game with nothing to complete.
                */}
                <div className={styles.difficultyLinkTop}>
                  <span className={styles.difficultyLinkLabel}>
                    {getDifficultyLabel(t, difficulty)}
                  </span>
                  {isAuthenticated ? (
                    isLoading ? (
                      <span className={`${styles.loadingBlock} ${styles.loadingPercent}`} />
                    ) : (
                      <span className={styles.difficultyLinkPercent}>
                        {t('{{percent}}% done', { percent: toCompletedShare(summary) })}
                      </span>
                    )
                  ) : null}
                </div>

                {isLoading ? (
                  <span className={`${styles.loadingBlock} ${styles.loadingText}`} />
                ) : (
                  <span className={styles.difficultyLinkProgressText}>
                    {isAuthenticated
                      ? t('{{completed}} of {{total}} solved', {
                          completed: summary.completed,
                          total: summary.total,
                        })
                      : t('{{count}} levels', { count: summary.total })}
                  </span>
                )}

                {/*
                  `aria-hidden`, because the count above already says this in words. A screen reader
                  reading a bar as well would be announcing the same number three times over.
                */}
                {isAuthenticated ? (
                  <div className={styles.difficultyLinkProgressTrack} aria-hidden="true">
                    <div
                      className={[
                        styles.difficultyLinkProgressFill,
                        isLoading ? styles.difficultyLinkProgressFillLoading : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ width: isLoading ? '38%' : `${toCompletedShare(summary)}%` }}
                    />
                  </div>
                ) : null}
              </Link>
            )
          })}
        </section>
      )}

      {/* Navigational boilerplate, the same pair every difficulty page carries. It is also how a
          crawler finds the two technique pages from the busiest branch of the site. */}
      <div className={styles.hubLinks}>
        <Link className={styles.hubLink} to="/how-to-solve">
          {t('Solving techniques')}
        </Link>
        <Link className={styles.hubLink} to="/difficulties">
          {t('What changes between sizes')}
        </Link>
      </div>
    </div>
  )
}
