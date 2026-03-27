import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

const LEVEL_CARD_HEIGHT = 112
const LEVEL_GRID_GAP = 16
const PAGE_SECTION_GAP = 20
const PAGINATION_HEIGHT = 56

function getGridColumns(viewportWidth: number) {
  if (viewportWidth <= 640) {
    return 2
  }

  if (viewportWidth <= 820) {
    return 3
  }

  if (viewportWidth <= 1040) {
    return 4
  }

  if (viewportWidth <= 1280) {
    return 5
  }

  return 6
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

function DifficultyLevelsPageScreen() {
  const { difficulty } = useParams()
  const [levels, setLevels] = useState<LevelSummary[]>([])
  const [progressByLevelNumber, setProgressByLevelNumber] = useState<Record<number, LevelProgress>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(18)
  const [isLoading, setIsLoading] = useState(true)
  const pageRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const { isAdmin, isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
  const { t } = useTranslation()

  useLayoutEffect(() => {
    function updatePageSize() {
      const pageElement = pageRef.current
      const headerElement = headerRef.current

      if (!pageElement || !headerElement) {
        return
      }

      const containerHeight = pageElement.parentElement?.clientHeight ?? window.innerHeight
      const headerHeight = headerElement.getBoundingClientRect().height
      const columns = getGridColumns(window.innerWidth)
      const availableHeight =
        containerHeight - headerHeight - PAGINATION_HEIGHT - PAGE_SECTION_GAP * 2
      const rows = Math.max(
        Math.floor((availableHeight + LEVEL_GRID_GAP) / (LEVEL_CARD_HEIGHT + LEVEL_GRID_GAP)),
        1,
      )

      setPageSize(columns * rows)
    }

    updatePageSize()

    const resizeObserver = new ResizeObserver(() => {
      updatePageSize()
    })

    if (pageRef.current) {
      resizeObserver.observe(pageRef.current)
    }

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current)
    }

    window.addEventListener('resize', updatePageSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePageSize)
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

  const normalizedPageSize = Math.max(pageSize, 1)
  const totalPages = Math.max(Math.ceil(levels.length / normalizedPageSize), 1)
  const currentVisiblePage = Math.min(currentPage, totalPages)

  if (!isDifficulty(difficulty)) {
    return (
      <div ref={pageRef} className={[styles.page, 'page-shell'].join(' ')}>
        <PageHeader
          eyebrow="Levels"
          title={t('Unknown difficulty.')}
          description={t('Choose one of the available difficulty groups to browse levels.')}
        />
      </div>
    )
  }

  const visibleLevels = levels.slice(
    (currentVisiblePage - 1) * normalizedPageSize,
    currentVisiblePage * normalizedPageSize,
  )

  return (
    <div ref={pageRef} className={[styles.page, 'page-shell'].join(' ')}>
      <div ref={headerRef}>
        <PageHeader
          backTo="/levels"
          backLabel={t('Back to all difficulties')}
          eyebrow={t('Levels')}
          title={t('{{difficulty}} Levels', { difficulty: getDifficultyLabel(t, difficulty) })}
          description={t('Choose a level to play.')}
        />
      </div>

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
          ? visibleLevels.map((level) => (
              <LevelCard
                key={level.id}
                levelNumber={level.levelNumber}
                bestTime={
                  !isTakeYourTimeEnabled
                    ? formatElapsedTime(
                        progressByLevelNumber[level.levelNumber]?.bestTimeSeconds ?? null,
                      )
                    : null
                }
                isLocked={
                  !isAdmin &&
                  level.levelNumber > 1 &&
                  (progressByLevelNumber[level.levelNumber - 1]?.bestTimeSeconds ?? null) === null
                }
                openTo={`/game/${level.difficulty}/${level.levelNumber}`}
                openLabel={t('Open level {{levelNumber}}', { levelNumber: level.levelNumber })}
                editTo={
                  isAdmin ? `/levels/${level.difficulty}/${level.levelNumber}/edit` : undefined
                }
                editLabel={
                  isAdmin
                    ? t('Edit level {{levelNumber}}', { levelNumber: level.levelNumber })
                    : undefined
                }
              />
            ))
          : null}

        {!isLoading && isAdmin && currentVisiblePage === totalPages ? (
          <LevelCard
            createTo={`/levels/${difficulty}/create`}
            createLabel={t('Create level')}
          />
        ) : null}
      </section>

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <Button
            onClick={() => setCurrentPage((page) => Math.max(Math.min(page, totalPages) - 1, 1))}
            disabled={currentVisiblePage === 1 || isLoading}
          >
            {t('Previous')}
          </Button>
          <p className={styles.paginationLabel}>
            {t('Page {{page}} of {{totalPages}}', { page: currentVisiblePage, totalPages })}
          </p>
          <Button
            onClick={() => setCurrentPage((page) => Math.min(Math.min(page, totalPages) + 1, totalPages))}
            disabled={currentVisiblePage === totalPages || isLoading}
          >
            {t('Next')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function DifficultyLevelsPage() {
  const { difficulty } = useParams()

  return <DifficultyLevelsPageScreen key={difficulty ?? 'unknown'} />
}
