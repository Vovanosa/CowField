import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { playSoundEffect, startMusic, stopMusic } from '../../game/audio/audioManager'
import {
  clearMoveHistory,
  getMoveHistoryCount,
  popMoveHistoryEntry,
  pushMoveHistoryEntry,
} from '../../game/storage/moveHistoryStorage'
import { getLevelByDifficultyAndNumber } from '../../game/storage/levelStorage'
import { completeLevelProgress, getLevelProgress } from '../../game/storage/progressStorage'
import { recordBullPlacements } from '../../game/storage/statisticsStorage'
import type { LevelDefinition, LevelProgress } from '../../game/types'
import {
  applyAutoPlacedDots,
  createEmptyBoard,
  createGameDragState,
  getInteractionTimestamp,
  getSolutionState,
  isDifficulty,
  resetGameDragState,
  type CellMark,
  type DragMode,
} from './gameSession.helpers'

export type CompletionModalState = {
  isOpen: boolean
  isNewBest: boolean
  isFirstClear: boolean
  timeSeconds: number
  bestTimeSeconds: number | null
  previousBestTimeSeconds: number | null
  /**
   * The modal is optimistic — it opens before the write lands. This tracks whether the write
   * actually succeeded, so a failure can be shown instead of silently telling the player their
   * progress was saved when it wasn't.
   */
  saveState: 'saving' | 'saved' | 'failed'
}

type UseGameSessionArgs = {
  difficulty: string | undefined
  levelNumber: string | undefined
  isGuest: boolean
  isAutoPlaceDotsEnabled: boolean
}

export function useGameSession({
  difficulty,
  levelNumber,
  isGuest,
  isAutoPlaceDotsEnabled,
}: UseGameSessionArgs) {
  const [level, setLevel] = useState<LevelDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // A flag, not a message: translating at render time means the error re-reads in the new
  // language when the player switches it, and keeps `t` out of this hook entirely.
  const [hasLoadError, setHasLoadError] = useState(false)
  // Bumping this re-runs the load effect, which is all a retry needs to do.
  const [reloadKey, setReloadKey] = useState(0)
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

  const completionHandledRef = useRef(false)
  const cellMarksRef = useRef<CellMark[]>([])
  const runStartedAtRef = useRef<number | null>(null)
  const elapsedSecondsRef = useRef(0)
  const levelProgressRef = useRef<LevelProgress | null>(null)
  const pendingBullPlacementsRef = useRef(0)
  const hasFlushedBullPlacementsRef = useRef(false)
  const dragStateRef = useRef(createGameDragState())

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
    resetGameDragState(dragStateRef)

    async function loadLevel() {
      try {
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
        setIsUnlocked(currentLevelNumber === 1 || previousLevelProgress?.bestTimeSeconds !== null)
        setCellMarks(nextLevel ? createEmptyBoard(nextLevel) : [])
        setActiveCellIndex(null)
        setHasLoadError(false)
      } catch (error) {
        reportUnexpectedError(error, `game level (${difficultyKey} ${currentLevelNumber})`)

        if (isActive) {
          // A failed load used to leave `isLoading` true forever — a permanent spinner where the
          // "level does not exist" empty state should have appeared.
          setHasLoadError(true)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadLevel()

    return () => {
      isActive = false
      clearMoveHistory()
      if (!isGuest && !hasFlushedBullPlacementsRef.current && pendingBullPlacementsRef.current > 0) {
        hasFlushedBullPlacementsRef.current = true
        void recordBullPlacements(pendingBullPlacementsRef.current, true)
      }
    }
  }, [difficulty, levelNumber, isGuest, reloadKey])

  useEffect(() => {
    function stopDragging() {
      resetGameDragState(dragStateRef)
    }

    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  useEffect(() => {
    if (isGuest) {
      return
    }

    // Bulls placed but not yet flushed are only in a ref, so closing or backgrounding the tab lost
    // them. `pagehide` is the reliable signal here (`beforeunload` doesn't fire on mobile), and
    // `keepalive` lets the request outlive the page.
    function flushPendingBullPlacements() {
      const pending = pendingBullPlacementsRef.current

      if (pending <= 0) {
        return
      }

      pendingBullPlacementsRef.current = 0
      hasFlushedBullPlacementsRef.current = true
      void recordBullPlacements(pending, true).catch(() => {
        // Nothing useful to do while the page is going away.
      })
    }

    window.addEventListener('pagehide', flushPendingBullPlacements)

    return () => {
      window.removeEventListener('pagehide', flushPendingBullPlacements)
    }
  }, [isGuest])

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

  useEffect(() => {
    startMusic('gameLoop')

    return () => {
      stopMusic()
    }
  }, [])

  /** Re-runs the level load after a failed one. */
  function handleRetryLoad() {
    setReloadKey((key) => key + 1)
  }

  const solutionState = level ? getSolutionState(level, cellMarks) : null

  const remainingBulls = solutionState
    ? Math.max(solutionState.requiredBullCount - solutionState.bullIndexes.length, 0)
    : 0

  function handleLevelSolved(currentLevel: LevelDefinition, completionTimeSeconds: number) {
    completionHandledRef.current = true
    playSoundEffect('levelComplete')
    clearMoveHistory()
    setCanUndo(false)
    elapsedSecondsRef.current = completionTimeSeconds
    runStartedAtRef.current = null
    setIsBoardLocked(true)
    setElapsedSeconds(completionTimeSeconds)
    setRunStartedAt(null)
    const previousBestTime = levelProgressRef.current?.bestTimeSeconds

    setCompletionModal({
      isOpen: true,
      isFirstClear: previousBestTime === null || previousBestTime === undefined,
      isNewBest:
        previousBestTime === null ||
        previousBestTime === undefined ||
        completionTimeSeconds < previousBestTime,
      timeSeconds: completionTimeSeconds,
      bestTimeSeconds:
        previousBestTime === null || previousBestTime === undefined
          ? completionTimeSeconds
          : Math.min(previousBestTime, completionTimeSeconds),
      previousBestTimeSeconds: previousBestTime ?? null,
      saveState: 'saving',
    })

    void saveCompletion(currentLevel, completionTimeSeconds)
  }

  async function saveCompletion(currentLevel: LevelDefinition, completionTimeSeconds: number) {
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
      setCompletionModal((currentModal) =>
        currentModal
          ? {
              ...currentModal,
              isNewBest: response.isNewBest,
              isFirstClear: currentModal.isFirstClear,
              timeSeconds: completionTimeSeconds,
              bestTimeSeconds: response.progress.bestTimeSeconds ?? currentModal.bestTimeSeconds,
              previousBestTimeSeconds: currentModal.previousBestTimeSeconds,
              saveState: 'saved',
            }
          : currentModal,
      )
    } catch {
      // The optimistic UI stays, but say so rather than claiming the progress was saved. Put the
      // placements back so a retry — or the unmount flush — still counts them.
      pendingBullPlacementsRef.current += pendingBullPlacements
      hasFlushedBullPlacementsRef.current = false
      setCompletionModal((currentModal) =>
        currentModal ? { ...currentModal, saveState: 'failed' } : currentModal,
      )
    }
  }

  function handleRetrySaveCompletion() {
    if (!level || completionModal?.saveState !== 'failed') {
      return
    }

    setCompletionModal((currentModal) =>
      currentModal ? { ...currentModal, saveState: 'saving' } : currentModal,
    )
    void saveCompletion(level, completionModal.timeSeconds)
  }

  function applyCellMarks(currentLevel: LevelDefinition, nextMarks: CellMark[], interactionTimestampMs: number) {
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

    const nextSolution = getSolutionState(currentLevel, resolvedMarks)

    if (!completionHandledRef.current && nextSolution.isSolved) {
      // Floor at 1s: a sub-second solve would otherwise report 0, which the API rejects.
      handleLevelSolved(
        currentLevel,
        Math.max(
          1,
          nextStartedAt === null
            ? elapsedSecondsRef.current
            : Math.floor((interactionTimestampMs - nextStartedAt) / 1000),
        ),
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
    if (!level || isBoardLocked) {
      return
    }

    startMusic('gameLoop')
    setActiveCellIndex(cellIndex)

    let nextAction: 'placeDot' | 'placeBull' | 'clearCell' | null = null

    const nextMarks = cellMarksRef.current.map((mark, index) => {
      if (index !== cellIndex) {
        return mark
      }

      if (mark === 'empty') {
        nextAction = 'placeDot'
        return 'dot'
      }

      if (mark === 'dot') {
        if (!isGuest) {
          pendingBullPlacementsRef.current += 1
        }
        nextAction = 'placeBull'
        return 'bull'
      }

      nextAction = 'clearCell'
      return 'empty'
    })

    if (nextMarks.every((mark, index) => mark === cellMarksRef.current[index])) {
      return
    }

    recordUndoSnapshot()
    applyCellMarks(level, nextMarks, interactionTimestampMs)

    if (nextAction) {
      playSoundEffect(nextAction)
    }
  }

  function applyDragMode(
    cellIndex: number,
    dragMode: Exclude<DragMode, null>,
    interactionTimestampMs: number,
  ) {
    if (!level || isBoardLocked) {
      return
    }

    startMusic('gameLoop')
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

    applyCellMarks(level, nextMarks, interactionTimestampMs)
    playSoundEffect(dragMode === 'add-dot' ? 'placeDot' : 'clearCell')
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
      applyDragMode(dragState.startIndex, dragState.dragMode, getInteractionTimestamp(event.timeStamp))
      dragState.visited.add(dragState.startIndex)
    }

    if (dragState.visited.has(cellIndex)) {
      return
    }

    dragState.visited.add(cellIndex)
    applyDragMode(cellIndex, dragState.dragMode, getInteractionTimestamp(event.timeStamp))
  }

  function handleCellPointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    if (isBoardLocked) {
      resetGameDragState(dragStateRef)
      return
    }

    const dragState = dragStateRef.current

    if (dragState.isMouseDown && !dragState.dragged && dragState.startIndex === cellIndex) {
      handleCellClick(cellIndex, getInteractionTimestamp(event.timeStamp))
    }

    resetGameDragState(dragStateRef)
  }

  function handleRestartBoard() {
    if (!level) {
      return
    }

    const emptyBoard = createEmptyBoard(level)

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
    resetGameDragState(dragStateRef)
    playSoundEffect('restart')
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

    const restoredMarks = previousMove.cellMarks

    completionHandledRef.current = false
    cellMarksRef.current = restoredMarks
    setCellMarks(restoredMarks)
    // Restore the clock too, not just the board. Each snapshot records these; ignoring them left
    // the timer frozen after undoing a completion, because runStartedAt stayed null.
    elapsedSecondsRef.current = previousMove.elapsedSeconds
    runStartedAtRef.current = previousMove.runStartedAt
    setElapsedSeconds(previousMove.elapsedSeconds)
    setRunStartedAt(previousMove.runStartedAt)
    setActiveCellIndex(null)
    setIsBoardLocked(false)
    setCompletionModal(null)
    resetGameDragState(dragStateRef)
    setCanUndo(getMoveHistoryCount() > 0)
    playSoundEffect('undo')
  }

  function handleCloseCompletionModal() {
    setCompletionModal((currentModal) => (currentModal ? { ...currentModal, isOpen: false } : null))
  }

  function handleCompletionBackdropClick(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleCloseCompletionModal()
    }
  }

  return {
    level,
    isLoading,
    hasLoadError,
    handleRetryLoad,
    cellMarks,
    elapsedSeconds,
    isBoardLocked,
    completionModal,
    hasNextLevel,
    isUnlocked,
    canUndo,
    activeCellIndex,
    invalidBullIndexes: solutionState?.invalidBullIndexes ?? new Set<number>(),
    remainingBulls,
    handleCellPointerDown,
    handleCellPointerEnter,
    handleCellPointerUp,
    handleRestartBoard,
    handleUndoMove,
    handleCompletionBackdropClick,
    handleRetrySaveCompletion,
    setCompletionModal,
  }
}
