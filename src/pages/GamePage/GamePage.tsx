import { ArrowLeft, SquarePen, TimerReset, Undo2 } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { GameBoard } from '../../components/GameBoard'
import { formatElapsedTime } from '../../game/formatElapsedTime'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import {
  clearMoveHistory,
  completeLevelProgress,
  getLevelByDifficultyAndNumber,
  getLevelProgress,
  getMoveHistoryCount,
  popMoveHistoryEntry,
  pushMoveHistoryEntry,
  recordBullPlacements,
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
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null)
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
  const pendingBullPlacementsRef = useRef(0)
  const hasFlushedBullPlacementsRef = useRef(false)
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
    pendingBullPlacementsRef.current = 0
    hasFlushedBullPlacementsRef.current = false
    resetDragState(dragStateRef)

    async function loadLevel() {
      const previousLevelProgressPromise =
        currentLevelNumber > 1
          ? getLevelProgress(difficultyKey, currentLevelNumber - 1)
          : Promise.resolve(null)

      const [nextLevel, nextProgress, previousLevelProgress] = await Promise.all([
        getLevelByDifficultyAndNumber(difficultyKey, currentLevelNumber),
        getLevelProgress(difficultyKey, currentLevelNumber),
        previousLevelProgressPromise,
      ])

      if (!isActive) {
        return
      }

      setLevel(nextLevel)
      setLevelProgress(nextProgress)
      setHasNextLevel(nextLevel?.hasNextLevel ?? false)
      setIsUnlocked(
        currentLevelNumber === 1 ||
          previousLevelProgress?.bestTimeSeconds !== null,
      )
      setCellMarks(nextLevel ? createEmptyBoard(nextLevel) : [])
      setActiveCellIndex(null)
      setIsLoading(false)
    }

    void loadLevel()

    return () => {
      isActive = false
      clearMoveHistory()
      if (!isGuest && !hasFlushedBullPlacementsRef.current && pendingBullPlacementsRef.current > 0) {
        hasFlushedBullPlacementsRef.current = true
        void recordBullPlacements(pendingBullPlacementsRef.current, true)
      }
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
      const pendingBullPlacements = pendingBullPlacementsRef.current
      pendingBullPlacementsRef.current = 0
      hasFlushedBullPlacementsRef.current = true

      try {
        const [response] = await Promise.all([
          completeLevelProgress(
            currentLevel.difficulty,
            currentLevel.levelNumber,
            completionTimeSeconds,
          ),
          !isGuest && pendingBullPlacements > 0
            ? recordBullPlacements(pendingBullPlacements)
            : Promise.resolve(null),
        ])

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

    setActiveCellIndex(cellIndex)

    const nextMarks = cellMarksRef.current.map((mark, index) => {
      if (index !== cellIndex) {
        return mark
      }

      if (mark === 'empty') {
        return 'dot'
      }

      if (mark === 'dot') {
        if (!isGuest) {
          pendingBullPlacementsRef.current += 1
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

    setActiveCellIndex(cellIndex)

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
    setActiveCellIndex(null)
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
    setActiveCellIndex(null)
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

          <GameBoard
            level={level}
            cellMarks={cellMarks}
            invalidBullIndexes={invalidBullIndexes}
            isBoardLocked={isBoardLocked}
            activeCellIndex={activeCellIndex}
            onCellPointerDown={handleCellPointerDown}
            onCellPointerEnter={handleCellPointerEnter}
            onCellPointerUp={handleCellPointerUp}
          />
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
