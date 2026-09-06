import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import {
  MAX_LEVEL_TIME_SECONDS,
  MIN_LEVEL_TIME_SECONDS,
} from '../../../shared/apiLimits'
import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { playSoundEffect, startMusic, stopMusic } from '../../game/audio/audioManager'
import {
  clearMoveHistory,
  getMoveHistoryCount,
  popMoveHistoryEntry,
  pushMoveHistoryEntry,
} from '../../game/storage/moveHistoryStorage'
import { getLevelByDifficultyAndNumber } from '../../game/storage/levelStorage'
import {
  completeLevelProgress,
  getBestTime,
  recordBullPlacements,
} from '../../game/storage/resources'
import type { LevelDefinition } from '../../game/types'
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
  // The best time on record for this level, or null if it has never been finished. That is the
  // whole of what the API sends and the whole of what this screen shows.
  const [bestTimeSeconds, setBestTimeSeconds] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null)
  const [isBoardLocked, setIsBoardLocked] = useState(false)
  const [completionModal, setCompletionModal] = useState<CompletionModalState | null>(null)
  const [nextLevelNumber, setNextLevelNumber] = useState<number | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(true)
  const [canUndo, setCanUndo] = useState(false)
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null)

  const completionHandledRef = useRef(false)
  const cellMarksRef = useRef<CellMark[]>([])
  const runStartedAtRef = useRef<number | null>(null)
  const elapsedSecondsRef = useRef(0)
  const bestTimeSecondsRef = useRef<number | null>(null)
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
    bestTimeSecondsRef.current = bestTimeSeconds
  }, [bestTimeSeconds])

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
        // Both progress reads are lookups in the one cached collection for this difficulty, not
        // requests. They used to be a request each — and the rows were already inside the collection
        // the levels page had just fetched. The unlock rule itself is unchanged: the level before
        // this one by number, the same rule the levels page applies when it decides which cards are
        // locked.
        const [nextLevel, nextBestTime, previousBestTime] = await Promise.all([
          getLevelByDifficultyAndNumber(difficultyKey, currentLevelNumber),
          getBestTime(difficultyKey, currentLevelNumber),
          currentLevelNumber > 1
            ? getBestTime(difficultyKey, currentLevelNumber - 1)
            : Promise.resolve(null),
        ])

        if (!isActive) {
          return
        }

        setLevel(nextLevel)
        setBestTimeSeconds(nextBestTime)
        setNextLevelNumber(nextLevel?.nextLevelNumber ?? null)
        setIsUnlocked(currentLevelNumber === 1 || previousBestTime !== null)
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

  /**
   * Stops the clock while the tab is not on screen.
   *
   * `runStartedAt` is a wall-clock anchor and elapsed time is `now - anchor`, so "pause" here means
   * pushing the anchor forward by however long the tab was hidden — the reading is unchanged at the
   * moment of return and simply carries on from there. Nothing else in the hook has to know: the
   * interval, the completion time and the undo snapshots all read the same anchor.
   *
   * Without it, completion time was the raw span from the first mark. A level left open overnight
   * became that level's best time *and* went into the lifetime "time played", which is meant to be
   * time actually spent playing.
   *
   * The ref is set alongside the state because `applyCellMarks` computes the completion time from
   * the ref, and the effect that mirrors state into it does not run until after the next render —
   * a solve on the very first tap back would otherwise still be charged for the hidden span.
   */
  useEffect(() => {
    if (runStartedAt === null || typeof document === 'undefined') {
      return
    }

    let hiddenAtMs: number | null = document.visibilityState === 'hidden' ? Date.now() : null

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAtMs = Date.now()
        return
      }

      if (hiddenAtMs === null || runStartedAtRef.current === null) {
        return
      }

      const hiddenForMs = Date.now() - hiddenAtMs
      hiddenAtMs = null

      if (hiddenForMs <= 0) {
        return
      }

      const resumedStartedAt = runStartedAtRef.current + hiddenForMs

      runStartedAtRef.current = resumedStartedAt
      setRunStartedAt(resumedStartedAt)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
    const previousBestTime = bestTimeSecondsRef.current

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
      // One request, not two. The bull-placement count rides along with the completion instead of
      // firing a parallel `POST /api/statistics/bull-placement`, which the server now folds into the
      // same transaction. That endpoint still exists for the `pagehide` flush, which genuinely has
      // nothing to travel with.
      const response = await completeLevelProgress(
        currentLevel.difficulty,
        currentLevel.levelNumber,
        completionTimeSeconds,
        !isGuest && pendingBullPlacements > 0
          ? { bullPlacements: pendingBullPlacements }
          : undefined,
      )

      setBestTimeSeconds(response.bestTimeSeconds)
      setCompletionModal((currentModal) =>
        currentModal
          ? {
              ...currentModal,
              isNewBest: response.isNewBest,
              isFirstClear: currentModal.isFirstClear,
              timeSeconds: completionTimeSeconds,
              bestTimeSeconds: response.bestTimeSeconds ?? currentModal.bestTimeSeconds,
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
      // Clamped to the API's own bounds (`shared/apiLimits.ts`), at both ends. A sub-second solve
      // would otherwise report 0; and the upper bound stays as a backstop even now that the clock
      // pauses on a hidden tab, because a level genuinely left open on screen for a day would
      // otherwise report a number the API refuses — losing the completion entirely rather than
      // recording an implausible time.
      handleLevelSolved(
        currentLevel,
        Math.min(
          MAX_LEVEL_TIME_SECONDS,
          Math.max(
            MIN_LEVEL_TIME_SECONDS,
            nextStartedAt === null
              ? elapsedSecondsRef.current
              : Math.floor((interactionTimestampMs - nextStartedAt) / 1000),
          ),
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
    // Restore the clock too, not just the board — ignoring the snapshot left the timer frozen
    // after undoing a completion, because runStartedAt stayed null. Only restore the anchor when
    // there isn't one: undo returns the board, not the time already spent, and a snapshot taken
    // before the tab was hidden holds an anchor from before the pause shifted it forward.
    const restoredStartedAt = runStartedAtRef.current ?? previousMove.runStartedAt

    elapsedSecondsRef.current = previousMove.elapsedSeconds
    runStartedAtRef.current = restoredStartedAt
    setElapsedSeconds(previousMove.elapsedSeconds)
    setRunStartedAt(restoredStartedAt)
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
    nextLevelNumber,
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
