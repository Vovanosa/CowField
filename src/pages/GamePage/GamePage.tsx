import { ArrowLeft, SquarePen, TimerReset, Undo2 } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { getColorForId, getGapColorForId } from '../../game/levels'
import { getUnlockedLevelNumbers } from '../../game/progression'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import {
  clearMoveHistory,
  completeLevelProgress,
  getMoveHistoryCount,
  getLevelByDifficultyAndNumber,
  getLevelProgress,
  getProgressByDifficulty,
  getLevelsByDifficulty,
  popMoveHistoryEntry,
  pushMoveHistoryEntry,
  recordBullPlacement,
} from '../../game/storage'
import { getBullsPerGroupForDifficulty } from '../../game/validation'
import type { Difficulty, LevelDefinition, LevelProgress } from '../../game/types'
import './GamePage.css'

type CellMark = 'empty' | 'dot' | 'bull'
type DragMode = 'add-dot' | 'clear-dot' | null

type CompletionModalState = {
  isOpen: boolean
  isNewBest: boolean
  timeSeconds: number
}

function getBullIndexes(marks: CellMark[]) {
  return marks
    .map((mark, index) => ({ mark, index }))
    .filter((entry) => entry.mark === 'bull')
    .map((entry) => entry.index)
}

function getAutoDotIndexes(level: LevelDefinition, bullIndexes: number[]) {
  const autoDotIndexes = new Set<number>()

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue
        }

        const nextRow = row + rowOffset
        const nextColumn = column + columnOffset

        if (
          nextRow < 0 ||
          nextRow >= level.gridSize ||
          nextColumn < 0 ||
          nextColumn >= level.gridSize
        ) {
          continue
        }

        autoDotIndexes.add(nextRow * level.gridSize + nextColumn)
      }
    }

    for (let nextColumn = 0; nextColumn < level.gridSize; nextColumn += 1) {
      if (nextColumn !== column) {
        autoDotIndexes.add(row * level.gridSize + nextColumn)
      }
    }

    for (let nextRow = 0; nextRow < level.gridSize; nextRow += 1) {
      if (nextRow !== row) {
        autoDotIndexes.add(nextRow * level.gridSize + column)
      }
    }

    for (let index = 0; index < level.pensByCell.length; index += 1) {
      if (level.pensByCell[index] === colorId && index !== bullIndex) {
        autoDotIndexes.add(index)
      }
    }
  }

  return autoDotIndexes
}

function applyAutoPlacedDots(
  level: LevelDefinition,
  previousMarks: CellMark[],
  draftNextMarks: CellMark[],
) {
  const previousAutoDots = getAutoDotIndexes(level, getBullIndexes(previousMarks))
  const nextBullIndexes = getBullIndexes(draftNextMarks)
  const nextAutoDots = getAutoDotIndexes(level, nextBullIndexes)
  const manualDots = new Set<number>()

  for (let index = 0; index < draftNextMarks.length; index += 1) {
    if (draftNextMarks[index] !== 'dot') {
      continue
    }

    const wasPreviousManualDot =
      previousMarks[index] === 'dot' && !previousAutoDots.has(index)

    if (wasPreviousManualDot || previousMarks[index] === 'empty') {
      manualDots.add(index)
    }
  }

  return draftNextMarks.map((mark, index) => {
    if (mark === 'bull') {
      return 'bull'
    }

    if (nextAutoDots.has(index) || manualDots.has(index)) {
      return 'dot'
    }

    return 'empty'
  })
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

function CowMarker() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="play-cow-marker"
      focusable="false"
    >
      <path
        d="M8 10 5.5 5.8l5 2.4L12.6 7h6.8l2.1 1.2 5-2.4L24 10v8.2A4.8 4.8 0 0 1 19.2 23H12.8A4.8 4.8 0 0 1 8 18.2Z"
        fill="var(--color-cow-fill)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12.2" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <circle cx="19.8" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <path
        d="M12.2 18.4h7.6a2.8 2.8 0 0 1-2.8 3h-2a2.8 2.8 0 0 1-2.8-3Z"
        fill="var(--color-cow-accent)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="14.4" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
      <circle cx="17.6" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
    </svg>
  )
}

function getSolutionState(level: LevelDefinition, marks: CellMark[], bullsPerGroup: number) {
  const bullIndexes = marks
    .map((mark, index) => ({ mark, index }))
    .filter((entry) => entry.mark === 'bull')
    .map((entry) => entry.index)

  const requiredBullCount = bullsPerGroup * level.gridSize
  const invalidBullIndexes = new Set<number>()
  const rowCounts = Array.from({ length: level.gridSize }, () => 0)
  const columnCounts = Array.from({ length: level.gridSize }, () => 0)
  const colorCounts = new Map<number, number>()
  const bullSet = new Set(bullIndexes)

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    rowCounts[row] += 1
    columnCounts[column] += 1
    colorCounts.set(colorId, (colorCounts.get(colorId) ?? 0) + 1)
  }

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    if (
      rowCounts[row] > bullsPerGroup ||
      columnCounts[column] > bullsPerGroup ||
      (colorCounts.get(colorId) ?? 0) > bullsPerGroup
    ) {
      invalidBullIndexes.add(bullIndex)
    }

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue
        }

        const nextRow = row + rowOffset
        const nextColumn = column + columnOffset

        if (
          nextRow < 0 ||
          nextRow >= level.gridSize ||
          nextColumn < 0 ||
          nextColumn >= level.gridSize
        ) {
          continue
        }

        const neighborIndex = nextRow * level.gridSize + nextColumn

        if (bullSet.has(neighborIndex)) {
          invalidBullIndexes.add(bullIndex)
          invalidBullIndexes.add(neighborIndex)
        }
      }
    }
  }

  return {
    requiredBullCount,
    bullIndexes,
    invalidBullIndexes,
    isSolved: bullIndexes.length === requiredBullCount && invalidBullIndexes.size === 0,
  }
}

function getCellBorderStyle(level: LevelDefinition, cellIndex: number) {
  const { gridSize, pensByCell } = level
  const colorId = pensByCell[cellIndex]
  const row = Math.floor(cellIndex / gridSize)
  const column = cellIndex % gridSize
  const internalBorderColor = 'var(--color-board-region-divider)'
  const sameColorGapColor = getGapColorForId(colorId)

  const rightNeighbor = column < gridSize - 1 ? pensByCell[cellIndex + 1] : null
  const bottomNeighbor = row < gridSize - 1 ? pensByCell[cellIndex + gridSize] : null

  return {
    boxShadow: [
      rightNeighbor !== null && rightNeighbor !== colorId
        ? `2px 0 0 ${internalBorderColor}`
        : rightNeighbor !== null
          ? `2px 0 0 ${sameColorGapColor}`
          : null,
      bottomNeighbor !== null && bottomNeighbor !== colorId
        ? `0 2px 0 ${internalBorderColor}`
        : bottomNeighbor !== null
          ? `0 2px 0 ${sameColorGapColor}`
          : null,
    ]
      .filter(Boolean)
      .join(', '),
  }
}

function getCellStyle(level: LevelDefinition, cellIndex: number, isInvalid: boolean) {
  const borderStyle = getCellBorderStyle(level, cellIndex)

  return {
    backgroundColor: getColorForId(level.pensByCell[cellIndex]),
    boxShadow: [
      isInvalid ? 'inset 0 0 0 3px var(--color-board-invalid-ring)' : null,
      isInvalid ? 'inset 0 0 0 999px var(--color-board-invalid-overlay)' : null,
      borderStyle.boxShadow || null,
    ]
      .filter(Boolean)
      .join(', '),
  }
}

function getIntersectionColor(level: LevelDefinition, row: number, column: number) {
  const { gridSize, pensByCell } = level
  const topLeft = pensByCell[(row - 1) * gridSize + (column - 1)]
  const topRight = pensByCell[(row - 1) * gridSize + column]
  const bottomLeft = pensByCell[row * gridSize + (column - 1)]
  const bottomRight = pensByCell[row * gridSize + column]

  const hasDarkGap =
    topLeft !== topRight ||
    topLeft !== bottomLeft ||
    topRight !== bottomRight ||
    bottomLeft !== bottomRight

  return hasDarkGap
    ? 'var(--color-board-region-divider)'
    : getGapColorForId(topLeft)
}

function getIntersectionStyle(
  level: LevelDefinition,
  row: number,
  column: number,
): CSSProperties {
  const gapSizePx = 2
  const totalGapPx = (level.gridSize - 1) * gapSizePx
  const cellTrack = `(100% - ${totalGapPx}px) / ${level.gridSize}`
  const left = `calc(${column} * (${cellTrack}) + ${(column - 1) * gapSizePx}px)`
  const top = `calc(${row} * (${cellTrack}) + ${(row - 1) * gapSizePx}px)`

  return {
    left,
    top,
    backgroundColor: getIntersectionColor(level, row, column),
  }
}

function createEmptyBoard(level: LevelDefinition) {
  return Array.from({ length: level.gridSize * level.gridSize }, () => 'empty' as const)
}

function resetDragState(
  dragStateRef: MutableRefObject<{
    isMouseDown: boolean
    startIndex: number | null
    startMark: CellMark | null
    dragMode: DragMode
    dragged: boolean
    visited: Set<number>
    historyRecorded: boolean
  }>,
) {
  dragStateRef.current = {
    isMouseDown: false,
    startIndex: null,
    startMark: null,
    dragMode: null,
    dragged: false,
    visited: new Set<number>(),
    historyRecorded: false,
  }
}

function GamePageScreen() {
  const { difficulty, levelNumber } = useParams()
  const navigate = useNavigate()
  const [level, setLevel] = useState<LevelDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cellMarks, setCellMarks] = useState<CellMark[]>([])
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null)
  const [isBoardLocked, setIsBoardLocked] = useState(false)
  const [completionModal, setCompletionModal] = useState<CompletionModalState | null>(null)
  const [hasNextLevel, setHasNextLevel] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(true)
  const [canUndo, setCanUndo] = useState(false)
  const { isAdmin, isGuest } = useRole()
  const settings = usePlayerSettings()
  const isTakeYourTimeEnabled = isGuest || settings?.takeYourTimeEnabled === true
  const isAutoPlaceDotsEnabled = settings?.autoPlaceDotsEnabled === true
  const { t } = useTranslation()
  const completionHandledRef = useRef(false)
  const cellMarksRef = useRef<CellMark[]>([])
  const runStartedAtRef = useRef<number | null>(null)
  const elapsedSecondsRef = useRef(0)
  const levelProgressRef = useRef<LevelProgress | null>(null)
  const dragStateRef = useRef<{
    isMouseDown: boolean
    startIndex: number | null
    startMark: CellMark | null
    dragMode: DragMode
    dragged: boolean
    visited: Set<number>
    historyRecorded: boolean
  }>({
    isMouseDown: false,
    startIndex: null,
    startMark: null,
    dragMode: null,
    dragged: false,
    visited: new Set<number>(),
    historyRecorded: false,
  })

  useEffect(() => {
    cellMarksRef.current = cellMarks
  }, [cellMarks])

  useEffect(() => {
    runStartedAtRef.current = runStartedAt
  }, [runStartedAt])

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds
  }, [elapsedSeconds])

  useEffect(() => {
    levelProgressRef.current = levelProgress
  }, [levelProgress])

  useEffect(() => {
    if (!isDifficulty(difficulty) || !levelNumber) {
      return
    }

    const difficultyKey = difficulty
    const currentLevelNumber = Number(levelNumber)
    let isActive = true

    clearMoveHistory()
    completionHandledRef.current = false
    resetDragState(dragStateRef)

    async function loadLevel() {
      const [nextLevel, nextProgress, nextLevelInSequence, difficultyLevels, difficultyProgress] = await Promise.all([
        getLevelByDifficultyAndNumber(difficultyKey, currentLevelNumber),
        getLevelProgress(difficultyKey, currentLevelNumber),
        getLevelByDifficultyAndNumber(difficultyKey, currentLevelNumber + 1),
        getLevelsByDifficulty(difficultyKey),
        getProgressByDifficulty(difficultyKey),
      ])

      if (!isActive) {
        return
      }

      setLevel(nextLevel)
      setLevelProgress(nextProgress)
      setHasNextLevel(nextLevelInSequence !== null)
      setIsUnlocked(
        getUnlockedLevelNumbers(
          difficultyLevels,
          difficultyProgress.reduce<Record<number, LevelProgress>>((allProgress, progress) => {
            allProgress[progress.levelNumber] = progress
            return allProgress
          }, {}),
        ).has(currentLevelNumber),
      )
      setCellMarks(nextLevel ? createEmptyBoard(nextLevel) : [])
      setIsLoading(false)
    }

    void loadLevel()

    return () => {
      isActive = false
      clearMoveHistory()
    }
  }, [difficulty, levelNumber])

  useEffect(() => {
    function stopDragging() {
      resetDragState(dragStateRef)
    }

    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  useEffect(() => {
    if (!completionModal?.isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCompletionModal((currentModal) =>
          currentModal ? { ...currentModal, isOpen: false } : null,
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [completionModal])

  useEffect(() => {
    if (runStartedAt === null) {
      return
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - runStartedAt) / 1000))
    }, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [runStartedAt])

  if (!isDifficulty(difficulty) || !levelNumber) {
    return (
      <div className="game-page">
        <p className="game-fallback-message">{t('The requested level route is invalid.')}</p>
      </div>
    )
  }

  const routeLevelLabel = `${getDifficultyLabel(t, difficulty)} / ${t('Level {{levelNumber}}', {
    levelNumber,
  })}`

  if (isLoading) {
    return (
      <div className="game-page">
        <p className="game-fallback-message">{t('Loading level...')}</p>
      </div>
    )
  }

  if (!level) {
    return (
      <div className="game-page">
        <div className="game-topbar">
          <div className="game-topbar-left">
            <Link className="round-icon-link" to={`/levels/${difficulty}`} aria-label={t('Back to levels')}>
              <ArrowLeft size={16} />
            </Link>
            <p className="game-topbar-title">{routeLevelLabel}</p>
          </div>
        </div>
        <div className="game-empty-state panel-surface">
          <p className="game-fallback-message">{t('This level does not exist yet.')}</p>
          {isAdmin ? (
            <Link className="primary-button" to={`/levels/${difficulty}/create`}>
              <SquarePen size={18} />
              {t('Create level')}
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  if (!isUnlocked && !isAdmin) {
    return (
      <div className="game-page">
        <div className="game-topbar">
          <div className="game-topbar-left">
            <Link className="round-icon-link" to={`/levels/${difficulty}`} aria-label={t('Back to levels')}>
              <ArrowLeft size={16} />
            </Link>
            <p className="game-topbar-title">{routeLevelLabel}</p>
          </div>
        </div>
        <div className="game-empty-state panel-surface">
          <p className="game-fallback-message">{t('This level is locked. Complete the previous level first to open it.')}</p>
        </div>
      </div>
    )
  }

  const currentLevel = level
  const bullsPerGroup = getBullsPerGroupForDifficulty(currentLevel.difficulty)
  const solutionState = getSolutionState(currentLevel, cellMarks, bullsPerGroup)
  const requiredBullCount = solutionState.requiredBullCount
  const bullIndexes = solutionState.bullIndexes
  const invalidBullIndexes = solutionState.invalidBullIndexes
  const remainingBulls = Math.max(requiredBullCount - bullIndexes.length, 0)

  function handleLevelSolved(completionTimeSeconds: number) {
    completionHandledRef.current = true
    clearMoveHistory()
    setCanUndo(false)
    elapsedSecondsRef.current = completionTimeSeconds
    runStartedAtRef.current = null
    setIsBoardLocked(true)
    setElapsedSeconds(completionTimeSeconds)
    setRunStartedAt(null)

    async function saveCompletion() {
      try {
        const response = await completeLevelProgress(
          currentLevel.difficulty,
          currentLevel.levelNumber,
          completionTimeSeconds,
        )

        setLevelProgress(response.progress)
        setCompletionModal({
          isOpen: true,
          isNewBest: response.isNewBest,
          timeSeconds: completionTimeSeconds,
        })
      } catch {
        const previousBestTime = levelProgressRef.current?.bestTimeSeconds

        setCompletionModal({
          isOpen: true,
          isNewBest:
            previousBestTime === null ||
            previousBestTime === undefined ||
            completionTimeSeconds < previousBestTime,
          timeSeconds: completionTimeSeconds,
        })
      }
    }

    void saveCompletion()
  }

  function applyCellMarks(nextMarks: CellMark[], interactionTimestampMs: number) {
    const resolvedMarks = isAutoPlaceDotsEnabled
      ? applyAutoPlacedDots(currentLevel, cellMarksRef.current, nextMarks)
      : nextMarks
    const nextStartedAt =
      runStartedAtRef.current === null && resolvedMarks.some((mark) => mark !== 'empty')
        ? interactionTimestampMs
        : runStartedAtRef.current

    if (runStartedAtRef.current === null && nextStartedAt !== null) {
      runStartedAtRef.current = nextStartedAt
      setRunStartedAt(nextStartedAt)
    }

    cellMarksRef.current = resolvedMarks
    setCellMarks(resolvedMarks)

    const nextSolution = getSolutionState(currentLevel, resolvedMarks, bullsPerGroup)

    if (!completionHandledRef.current && nextSolution.isSolved) {
      handleLevelSolved(
        nextStartedAt === null
          ? elapsedSecondsRef.current
          : Math.floor((interactionTimestampMs - nextStartedAt) / 1000),
      )
    }
  }

  function recordUndoSnapshot() {
    pushMoveHistoryEntry({
      cellMarks: [...cellMarksRef.current],
      elapsedSeconds: elapsedSecondsRef.current,
      runStartedAt: runStartedAtRef.current,
    })
    setCanUndo(true)
  }

  function handleCellClick(cellIndex: number, interactionTimestampMs: number) {
    if (isBoardLocked) {
      return
    }

    const nextMarks = cellMarksRef.current.map((mark, index) => {
      if (index !== cellIndex) {
        return mark
      }

      if (mark === 'empty') {
        return 'dot'
      }

      if (mark === 'dot') {
        if (!isGuest) {
          void recordBullPlacement()
        }
        return 'bull'
      }

      return 'empty'
    })

    if (nextMarks.every((mark, index) => mark === cellMarksRef.current[index])) {
      return
    }

    recordUndoSnapshot()
    applyCellMarks(nextMarks, interactionTimestampMs)
  }

  function applyDragMode(
    cellIndex: number,
    dragMode: Exclude<DragMode, null>,
    interactionTimestampMs: number,
  ) {
    if (isBoardLocked) {
      return
    }

    const nextMarks = cellMarksRef.current.map((mark, index) => {
      if (index !== cellIndex || mark === 'bull') {
        return mark
      }

      return dragMode === 'add-dot' ? 'dot' : 'empty'
    })

    if (nextMarks.every((mark, index) => mark === cellMarksRef.current[index])) {
      return
    }

    if (!dragStateRef.current.historyRecorded) {
      recordUndoSnapshot()
      dragStateRef.current.historyRecorded = true
    }

    applyCellMarks(nextMarks, interactionTimestampMs)
  }

  function handleCellPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    if (isBoardLocked) {
      return
    }

    event.preventDefault()
    const startMark = cellMarks[cellIndex]

    dragStateRef.current = {
      isMouseDown: true,
      startIndex: cellIndex,
      startMark,
      dragMode:
        startMark === 'empty'
          ? 'add-dot'
          : startMark === 'dot'
            ? 'clear-dot'
            : null,
      dragged: false,
      visited: new Set<number>(),
      historyRecorded: false,
    }
  }

  function handleCellPointerEnter(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    if (isBoardLocked) {
      return
    }

    const dragState = dragStateRef.current

    if (!dragState.isMouseDown || dragState.dragMode === null || dragState.startIndex === null) {
      return
    }

    if (!dragState.dragged) {
      dragState.dragged = true
      applyDragMode(dragState.startIndex, dragState.dragMode, performance.timeOrigin + event.timeStamp)
      dragState.visited.add(dragState.startIndex)
    }

    if (dragState.visited.has(cellIndex)) {
      return
    }

    dragState.visited.add(cellIndex)
    applyDragMode(cellIndex, dragState.dragMode, performance.timeOrigin + event.timeStamp)
  }

  function handleCellPointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    if (isBoardLocked) {
      resetDragState(dragStateRef)
      return
    }

    const dragState = dragStateRef.current

    if (dragState.isMouseDown && !dragState.dragged && dragState.startIndex === cellIndex) {
      handleCellClick(cellIndex, performance.timeOrigin + event.timeStamp)
    }

    resetDragState(dragStateRef)
  }

  function handleRestartBoard() {
    const emptyBoard = createEmptyBoard(currentLevel)

    clearMoveHistory()
    setCanUndo(false)
    cellMarksRef.current = emptyBoard
    runStartedAtRef.current = null
    elapsedSecondsRef.current = 0
    setCellMarks(emptyBoard)
    setElapsedSeconds(0)
    setRunStartedAt(null)
    setIsBoardLocked(false)
    setCompletionModal(null)
    completionHandledRef.current = false
    resetDragState(dragStateRef)
  }

  function handleUndoMove() {
    if (!canUndo || isBoardLocked) {
      return
    }

    const previousMove = popMoveHistoryEntry()

    if (!previousMove) {
      setCanUndo(false)
      return
    }

    const restoredMarks = previousMove.cellMarks as CellMark[]

    completionHandledRef.current = false
    cellMarksRef.current = restoredMarks
    setCellMarks(restoredMarks)
    setIsBoardLocked(false)
    setCompletionModal(null)
    resetDragState(dragStateRef)
    setCanUndo(getMoveHistoryCount() > 0)
  }

  function handleCloseCompletionModal() {
    setCompletionModal((currentModal) => (currentModal ? { ...currentModal, isOpen: false } : null))
  }

  function handleCompletionBackdropClick(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleCloseCompletionModal()
    }
  }

  function handleBackToLevels() {
    navigate(`/levels/${difficulty}`)
  }

  function handleNextLevel() {
    if (!hasNextLevel) {
      return
    }

    navigate(`/game/${difficulty}/${currentLevel.levelNumber + 1}`)
  }

  return (
    <div className="game-page">
        <div className="game-topbar">
        <div className="game-topbar-left">
          <Link className="round-icon-link" to={`/levels/${difficulty}`} aria-label={t('Back to levels')}>
            <ArrowLeft size={16} />
          </Link>
          <p className="game-topbar-title">{routeLevelLabel}</p>
        </div>
      </div>

      <section className="game-layout">
        <div className="board-panel panel-surface">
          <div className="board-panel-header">
            <div className="board-panel-header-left">
              <button
                type="button"
                className="secondary-button board-undo-button"
                onClick={handleUndoMove}
                disabled={!canUndo || isBoardLocked}
                aria-label={t('Undo')}
                data-tooltip={t('Undo')}
              >
                <Undo2 size={18} />
              </button>
            </div>
            <div className="board-panel-header-right">
              <div className="board-stat board-stat-compact">
                  <p className="board-panel-label">{t('Remaining bulls')}</p>
                <strong className="board-panel-value">{remainingBulls}</strong>
              </div>
              {!isTakeYourTimeEnabled ? (
                <div className="board-stat board-stat-compact">
                  <p className="board-panel-label">{t('Timer')}</p>
                  <strong className="board-panel-value">{formatElapsedTime(elapsedSeconds)}</strong>
                </div>
              ) : null}
            </div>
            {isAdmin ? (
              <div className="board-toolbar">
                {isBoardLocked && hasNextLevel ? (
                  <button
                    type="button"
                    className="primary-button board-next-button"
                    onClick={handleNextLevel}
                  >
                    {t('Next Level')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary-button board-reset-button"
                  onClick={handleRestartBoard}
                >
                  <TimerReset size={18} />
                  {t('Restart')}
                </button>
                <Link
                  className="secondary-button"
                  to={`/levels/${difficulty}/${level.levelNumber}/edit`}
                >
                  <SquarePen size={18} />
                  {t('Edit level')}
                </Link>
              </div>
            ) : (
              <div className="board-toolbar">
                {isBoardLocked && hasNextLevel ? (
                  <button
                    type="button"
                    className="primary-button board-next-button"
                    onClick={handleNextLevel}
                  >
                    {t('Next Level')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary-button board-reset-button"
                  onClick={handleRestartBoard}
                >
                  <TimerReset size={18} />
                  {t('Restart')}
                </button>
              </div>
            )}
          </div>

          <div className="board-preview" aria-label="Puzzle board">
            <div
              className="board-preview-grid"
              style={{ gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))` }}
            >
              {level.pensByCell.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={
                    invalidBullIndexes.has(index)
                      ? 'board-cell board-cell-invalid'
                      : 'board-cell'
                  }
                  style={getCellStyle(level, index, invalidBullIndexes.has(index))}
                  onPointerDown={(event) => handleCellPointerDown(event, index)}
                  onPointerEnter={(event) => handleCellPointerEnter(event, index)}
                  onPointerUp={(event) => handleCellPointerUp(event, index)}
                  onDragStart={(event) => event.preventDefault()}
                  disabled={isBoardLocked}
                >
                  {cellMarks[index] === 'dot' ? <span className="board-cell-dot" /> : null}
                  {cellMarks[index] === 'bull' ? <CowMarker /> : null}
                </button>
              ))}

              {Array.from({ length: Math.max(level.gridSize - 1, 0) }, (_, rowIndex) =>
                Array.from({ length: Math.max(level.gridSize - 1, 0) }, (_, columnIndex) => (
                  <span
                    key={`intersection-${rowIndex + 1}-${columnIndex + 1}`}
                    className="board-grid-intersection"
                    style={getIntersectionStyle(level, rowIndex + 1, columnIndex + 1)}
                    aria-hidden="true"
                  />
                )),
              )}
            </div>
          </div>
        </div>
      </section>

      {completionModal?.isOpen ? (
        <div
          className="game-completion-modal-backdrop"
          onPointerDown={handleCompletionBackdropClick}
        >
          <section
            className="game-completion-modal panel-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-completion-title"
          >
            <h2 id="game-completion-title">{t('Level completed!')}</h2>
            {!isTakeYourTimeEnabled ? (
              <p className="game-completion-time">{formatElapsedTime(completionModal.timeSeconds)}</p>
            ) : null}
            {!isTakeYourTimeEnabled && completionModal.isNewBest ? (
              <p className="game-completion-best">{t('New best time!')}</p>
            ) : null}
            <div className="game-completion-actions">
              <button type="button" className="secondary-button" onClick={handleBackToLevels}>
                {t('Back')}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleNextLevel}
                disabled={!hasNextLevel}
              >
                {t('Next Level')}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export function GamePage() {
  const { difficulty, levelNumber } = useParams()

  return <GamePageScreen key={`${difficulty ?? 'unknown'}-${levelNumber ?? 'unknown'}`} />
}
