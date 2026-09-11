import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { useRole } from '../../app/role'
import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { EmptyState } from '../../components/EmptyState'
import { LevelCard } from '../../components/LevelCard'
import { Button, PageHeader, Panel } from '../../components/ui'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { isDifficulty } from '../../game/levels/constants'
import { getDifficultyLevelsPageData } from '../../game/storage/resources'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import type { BestTimesByLevel } from '../../game/types'
import styles from './DifficultyLevelsPage.module.css'
import { useGridColumnCount } from './useGridColumnCount'

/**
 * The grid is paginated to whole rows. Multiplying by the *measured* column count keeps that true
 * at every width; the viewport-keyed ladder this replaces could not, because the grid's container is
 * capped at 860px and stops tracking the viewport well before the breakpoints did.
 */
const ROWS_PER_PAGE = 4

function getVisiblePageButtons(currentPage: number, totalPages: number, maxVisibleButtons: number) {
  const visibleButtons = Math.min(Math.max(maxVisibleButtons, 1), totalPages)
  const halfWindow = Math.floor(visibleButtons / 2)
  const start = Math.max(Math.min(currentPage - halfWindow, totalPages - visibleButtons + 1), 1)

  return Array.from({ length: visibleButtons }, (_, index) => start + index)
}

function DifficultyLevelsPageScreen() {
  const { difficulty } = useParams()
  const [levelNumbers, setLevelNumbers] = useState<number[]>([])
  const [bestTimes, setBestTimes] = useState<BestTimesByLevel>({})
  const [currentPage, setCurrentPage] = useState(1)
  // Held in state rather than a ref so the measuring effect re-runs when the grid mounts and
  // unmounts — it is not rendered at all in the load-error branch.
  const [gridElement, setGridElement] = useState<HTMLElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // A flag, not a message: translating at render time means the error re-reads in the new
  // language when the player switches it, and keeps `t` out of the effect's dependencies.
  const [hasLoadError, setHasLoadError] = useState(false)
  // Bumping this re-runs the load effect, which is all "Try again" needs to do — the page cache is
  // only written on success, so a retry really does re-request.
  const [reloadKey, setReloadKey] = useState(0)
  // Only once the retry has finished failing: while a retry is in flight the page shows its
  // skeletons again rather than a stale error next to a dead button.
  const showLoadError = hasLoadError && !isLoading
  const columnCount = useGridColumnCount(gridElement)
  const { isAdmin, isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
  const { t } = useTranslation()

  // Before the `isDifficulty` guard at the bottom of this component, so the hook runs on every
  // render rather than only on the valid-route path.
  useDocumentMeta({
    title: brandedTitle(
      isDifficulty(difficulty)
        ? t('{{difficulty}} Levels', { difficulty: getDifficultyLabel(t, difficulty) })
        : t('Unknown difficulty.'),
    ),
    robots: 'noindex',
  })

  useEffect(() => {
    if (!isDifficulty(difficulty)) {
      return
    }

    const difficultyKey = difficulty
    let isActive = true

    async function loadLevels() {
      try {
        const nextData = await getDifficultyLevelsPageData(difficultyKey)

        if (!isActive) {
          return
        }

        setLevelNumbers(nextData.levelNumbers)
        setBestTimes(nextData.bestTimes)
        setHasLoadError(false)
      } catch (error) {
        reportUnexpectedError(error, `levels page (${difficultyKey})`)

        if (isActive) {
          setHasLoadError(true)
        }
      } finally {
        // `finally`, not the success path: without it a failed request left the card skeletons up
        // permanently and reported nothing.
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadLevels()

    return () => {
      isActive = false
    }
  }, [difficulty, reloadKey])

  const normalizedPageSize = columnCount * ROWS_PER_PAGE
  const levelItems = [
    ...levelNumbers.map((levelNumber) => ({ type: 'level' as const, levelNumber })),
    ...(isAdmin ? [{ type: 'create' as const }] : []),
  ]
  const totalPages = Math.max(Math.ceil(levelItems.length / normalizedPageSize), 1)
  const currentVisiblePage = Math.min(currentPage, totalPages)
  const visiblePageButtons = getVisiblePageButtons(
    currentVisiblePage,
    totalPages,
    // Four columns or fewer is where the old `viewportWidth <= 640` test used to trip, so this keeps
    // the same button count at every width while reading the container instead of the window.
    columnCount <= 4 ? 3 : 5,
  )

  if (!isDifficulty(difficulty)) {
    return (
      <div className={[styles.page, 'page-shell'].join(' ')}>
        <PageHeader
          title={t('Unknown difficulty.')}
          description={t('Choose one of the available difficulty groups to browse levels.')}
        />
      </div>
    )
  }

  const visibleItems = levelItems.slice(
    (currentVisiblePage - 1) * normalizedPageSize,
    currentVisiblePage * normalizedPageSize,
  )

  return (
    <div className={[styles.page, 'page-shell'].join(' ')}>
      <PageHeader
        backTo="/levels"
        backLabel={t('Back to all difficulties')}
        title={t('{{difficulty}} Levels', { difficulty: getDifficultyLabel(t, difficulty) })}
      />

      {showLoadError ? (
        <EmptyState
          message={t("Couldn't load these levels. Check your connection and try again.")}
          actions={
            <Button variant="primary" onClick={() => setReloadKey((key) => key + 1)}>
              {t('Try again')}
            </Button>
          }
        />
      ) : (
        <section className={styles.levelsGrid} ref={setGridElement}>
          {isLoading
            ? Array.from({ length: normalizedPageSize }, (_, index) => (
                <Panel key={`level-skeleton-${index}`} className={styles.levelCardSkeleton}>
                  <div className={styles.levelCardSkeletonBody} aria-hidden="true">
                    <span className={styles.levelCardSkeletonNumber} />
                    <span className={styles.levelCardSkeletonTime} />
                  </div>
                </Panel>
              ))
            : null}

          {!isLoading
            ? visibleItems.map((item) =>
                item.type === 'create' ? (
                  <LevelCard
                    key={`create-${difficulty}`}
                    createTo={`/levels/${difficulty}/create`}
                    createLabel={t('Create level')}
                  />
                ) : (
                  <LevelCard
                    key={`${difficulty}-${item.levelNumber}`}
                    levelNumber={item.levelNumber}
                    bestTime={
                      !isTakeYourTimeEnabled
                        ? formatElapsedTime(bestTimes[item.levelNumber] ?? null)
                        : null
                    }
                    // An absent entry is exactly "not finished", which is what the API now says by
                    // omitting the level rather than sending a row with a null time.
                    isLocked={
                      !isAdmin &&
                      item.levelNumber > 1 &&
                      bestTimes[item.levelNumber - 1] === undefined
                    }
                    openTo={`/game/${difficulty}/${item.levelNumber}`}
                    openLabel={t('Open level {{levelNumber}}', { levelNumber: item.levelNumber })}
                    editTo={
                      isAdmin ? `/levels/${difficulty}/${item.levelNumber}/edit` : undefined
                    }
                    editLabel={
                      isAdmin
                        ? t('Edit level {{levelNumber}}', { levelNumber: item.levelNumber })
                        : undefined
                    }
                  />
                ),
              )
            : null}
        </section>
      )}

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <p className={styles.paginationSummary}>
            {t('Page {{page}} of {{totalPages}}', { page: currentVisiblePage, totalPages })}
          </p>
          <div className={styles.paginationControls}>
            <Button
              size="sm"
              iconOnly
              className={styles.paginationNavButton}
              aria-label={t('Previous')}
              onClick={() => setCurrentPage((page) => Math.max(Math.min(page, totalPages) - 1, 1))}
              disabled={currentVisiblePage === 1 || isLoading}
              leadingIcon={<ChevronLeft size={18} />}
            >
              {null}
            </Button>

            <div className={styles.paginationPageList} role="navigation" aria-label={t('Levels')}>
              {visiblePageButtons.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={[
                    styles.paginationPageButton,
                    pageNumber === currentVisiblePage ? styles.paginationPageButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={pageNumber === currentVisiblePage ? 'page' : undefined}
                  disabled={isLoading}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              iconOnly
              className={styles.paginationNavButton}
              aria-label={t('Next')}
              onClick={() =>
                setCurrentPage((page) => Math.min(Math.min(page, totalPages) + 1, totalPages))
              }
              disabled={currentVisiblePage === totalPages || isLoading}
              leadingIcon={<ChevronRight size={18} />}
            >
              {null}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function DifficultyLevelsPage() {
  const { difficulty } = useParams()

  return <DifficultyLevelsPageScreen key={difficulty ?? 'unknown'} />
}
