import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { LevelCard } from '../../components/LevelCard'
import { Button, PageHeader, Panel } from '../../components/ui'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getDifficultyLevelsPageData } from '../../game/storage/difficultyLevelsPageStorage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import type { Difficulty, LevelProgress, LevelSummary } from '../../game/types'
import styles from './DifficultyLevelsPage.module.css'

function getPageSize(viewportWidth: number) {
  if (viewportWidth <= 640) {
    return 12
  }

  if (viewportWidth <= 820) {
    return 12
  }

  if (viewportWidth <= 1040) {
    return 16
  }

  if (viewportWidth <= 1280) {
    return 20
  }

  return 24
}

function getVisiblePageButtons(currentPage: number, totalPages: number, maxVisibleButtons: number) {
  const visibleButtons = Math.min(Math.max(maxVisibleButtons, 1), totalPages)
  const halfWindow = Math.floor(visibleButtons / 2)
  const start = Math.max(Math.min(currentPage - halfWindow, totalPages - visibleButtons + 1), 1)

  return Array.from({ length: visibleButtons }, (_, index) => start + index)
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

function DifficultyLevelsPageScreen() {
  const { difficulty } = useParams()
  const [levels, setLevels] = useState<LevelSummary[]>([])
  const [progressByLevelNumber, setProgressByLevelNumber] = useState<Record<number, LevelProgress>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 1280
    }

    return window.innerWidth
  })
  const [isLoading, setIsLoading] = useState(true)
  const { isAdmin, isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
  const { t } = useTranslation()

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (!isDifficulty(difficulty)) {
      return
    }

    const difficultyKey = difficulty
    let isActive = true

    async function loadLevels() {
      setIsLoading(true)

      const nextData = await getDifficultyLevelsPageData(difficultyKey)

      if (!isActive) {
        return
      }

      setLevels(nextData.levels)
      setProgressByLevelNumber(nextData.progressByLevelNumber)
      setIsLoading(false)
    }

    void loadLevels()

    return () => {
      isActive = false
    }
  }, [difficulty])

  const normalizedPageSize = getPageSize(viewportWidth)
  const levelItems = [
    ...levels.map((level) => ({ type: 'level' as const, level })),
    ...(isAdmin ? [{ type: 'create' as const }] : []),
  ]
  const totalPages = Math.max(Math.ceil(levelItems.length / normalizedPageSize), 1)
  const currentVisiblePage = Math.min(currentPage, totalPages)
  const visiblePageButtons = getVisiblePageButtons(
    currentVisiblePage,
    totalPages,
    viewportWidth <= 640 ? 3 : 5,
  )

  if (!isDifficulty(difficulty)) {
    return (
      <div className={[styles.page, 'page-shell'].join(' ')}>
        <PageHeader
          eyebrow="Levels"
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
        eyebrow={t('Levels')}
        title={t('{{difficulty}} Levels', { difficulty: getDifficultyLabel(t, difficulty) })}
      />

      <section className={styles.levelsGrid}>
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
                  key={item.level.id}
                  levelNumber={item.level.levelNumber}
                  bestTime={
                    !isTakeYourTimeEnabled
                      ? formatElapsedTime(
                          progressByLevelNumber[item.level.levelNumber]?.bestTimeSeconds ?? null,
                        )
                      : null
                  }
                  isLocked={
                    !isAdmin &&
                    item.level.levelNumber > 1 &&
                    (progressByLevelNumber[item.level.levelNumber - 1]?.bestTimeSeconds ?? null) ===
                      null
                  }
                  openTo={`/game/${item.level.difficulty}/${item.level.levelNumber}`}
                  openLabel={t('Open level {{levelNumber}}', { levelNumber: item.level.levelNumber })}
                  editTo={
                    isAdmin
                      ? `/levels/${item.level.difficulty}/${item.level.levelNumber}/edit`
                      : undefined
                  }
                  editLabel={
                    isAdmin
                      ? t('Edit level {{levelNumber}}', { levelNumber: item.level.levelNumber })
                      : undefined
                  }
                />
              ),
            )
          : null}
      </section>

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
