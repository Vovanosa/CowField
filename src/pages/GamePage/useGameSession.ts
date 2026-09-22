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
  /**
   * What each bull placed with `Shift` + `Space` was covering, so taking it away puts that back.
   * Keyed by cell index, pruned in `applyCellMarks` for any cell that is no longer a bull.
   */
  const bullCoveredMarkRef = useRef(new Map<number, CellMark>())

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
    bullCoveredMarkRef.current.clear()
    resetGameDragState(dragStateRef)

    async function loadLevel() {
      try {
        // The best time is a lookup in the one cached collection for this difficulty, not a
        // request. The previous level's time used to be read alongside it, to decide whether this
        // level was unlocked; P18 removed level locking entirely, so that read went with it.
        const [nextLevel, nextBestTime] = await Promise.all([
          getLevelByDifficultyAndNumber(difficultyKey, currentLevelNumber),
          getBestTime(difficultyKey, currentLevelNumber),
        ])

        if (!isActive) {
          return
        }

        setLevel(nextLevel)
        setBestTimeSeconds(nextBestTime)
        setNextLevelNumber(nextLevel?.nextLevelNumber ?? null)
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

  /** Nothing placed yet, or everything taken back off. */
  function isBoardEmpty(marks: readonly CellMark[]) {
    return marks.every((mark) => mark === 'empty')
  }

  /** Back to 00:00, not running. The state a fresh board is in. */
  function stopClock() {
    runStartedAtRef.current = null
    elapsedSecondsRef.current = 0
    setRunStartedAt(null)
    setElapsedSeconds(0)
  }

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

    // **An empty board is a run that has not started.** The clock starts on the first mark, so
    // taking the last one off has to put it back to zero — otherwise clearing the board and
    // beginning again reports a time that includes however long the abandoned attempt took. This is
    // the mirror of the line above, and the only way to reach `Restart`'s state without restarting.
    if (isBoardEmpty(resolvedMarks)) {
      stopClock()
    }

    cellMarksRef.current = resolvedMarks
    setCellMarks(resolvedMarks)

    // Every route a mark can change passes through here — a tap, a drag, an undo, a restart — so
    // this is the one place that can keep the bull-toggle's memory honest. A cell that is no longer
    // a bull has nothing left to uncover.
    for (const cellIndex of bullCoveredMarkRef.current.keys()) {
      if (resolvedMarks[cellIndex] !== 'bull') {
        bullCoveredMarkRef.current.delete(cellIndex)
      }
    }

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

  /**
   * A drag, in three beats: press, enter a cell, release.
   *
   * **The keyboard and the pointer share these rather than each having their own.** `Space` is the
   * held button and the arrows are the movement, so a keyboard drag is the same gesture arriving
   * through different events — and two implementations of one gesture is how they drift apart. The
   * pointer handlers below and the keyboard handlers under them are both thin wrappers over these
   * three, differing only in where the timestamp comes from and what a tap means.
   */
  function beginDrag(cellIndex: number) {
    if (isBoardLocked) {
      return
    }

    // The ref, not `cellMarks`: a keyboard drag can start in the same tick as the action before it
    // (release, then press again while a re-render is still pending), and the state variable is a
    // render behind at that moment. The ref is written synchronously by `applyCellMarks`.
    const startMark = cellMarksRef.current[cellIndex]

    dragStateRef.current = {
      isPressed: true,
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

  function enterDragCell(cellIndex: number, interactionTimestampMs: number) {
    if (isBoardLocked) {
      return
    }

    const dragState = dragStateRef.current

    if (!dragState.isPressed || dragState.startIndex === null) {
      return
    }

    /*
      **The cursor moved, so this is a drag — whether or not there is anything to paint.**

      `dragged` used to be set only on the painting path, below the `dragMode === null` guard. A drag
      that starts on a bull paints nothing by design, so it never got set, and releasing then looked
      like a tap: hold Space on a bull, arrow away, let go, and the bull you were standing on cycled
      to empty. Measured on the demo board 2026-09-22.

      The pointer was accidentally safe from it — `handleCellPointerUp` also requires the release to
      land on the starting cell — but only accidentally, and not for a drag that wandered off and
      came back.
    */
    const wasStillATap = !dragState.dragged
    dragState.dragged = true

    if (dragState.dragMode === null) {
      return
    }

    if (wasStillATap) {
      applyDragMode(dragState.startIndex, dragState.dragMode, interactionTimestampMs)
      dragState.visited.add(dragState.startIndex)
    }

    if (dragState.visited.has(cellIndex)) {
      return
    }

    dragState.visited.add(cellIndex)
    applyDragMode(cellIndex, dragState.dragMode, interactionTimestampMs)
  }

  function handleCellPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    if (isBoardLocked) {
      return
    }

    event.preventDefault()
    beginDrag(cellIndex)
  }

  function handleCellPointerEnter(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    enterDragCell(cellIndex, getInteractionTimestamp(event.timeStamp))
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

    if (dragState.isPressed && !dragState.dragged && dragState.startIndex === cellIndex) {
      handleCellClick(cellIndex, getInteractionTimestamp(event.timeStamp))
    }

    resetGameDragState(dragStateRef)
  }

  /** `Space` down. Arms the same drag a `pointerdown` arms, and marks nothing yet. */
  function handleCellKeyDragStart(cellIndex: number) {
    beginDrag(cellIndex)
  }

  /** An arrow pressed while `Space` is held — one call per cell the cursor passes through. */
  function handleCellKeyDragEnter(cellIndex: number, interactionTimestampMs: number) {
    enterDragCell(cellIndex, interactionTimestampMs)
  }

  /**
   * `Space` released.
   *
   * If the cursor never moved this was a tap, and **the modifier held at release decides which
   * tap** — plain cycles the cell, `Shift` toggles a bull. If it did move it was a drag, already
   * painted, and releasing only ends it.
   */
  function handleCellKeyDragEnd(interactionTimestampMs: number, withShift: boolean) {
    if (isBoardLocked) {
      resetGameDragState(dragStateRef)
      return
    }

    const dragState = dragStateRef.current

    if (dragState.isPressed && !dragState.dragged && dragState.startIndex !== null) {
      if (withShift) {
        handleToggleBull(dragState.startIndex, interactionTimestampMs)
      } else {
        handleCellClick(dragState.startIndex, interactionTimestampMs)
      }
    }

    resetGameDragState(dragStateRef)
  }

  /** Focus left the board with `Space` still down — drop the gesture, commit nothing. */
  function handleCellKeyDragCancel() {
    resetGameDragState(dragStateRef)
  }

  /**
   * `Shift` + `Space`: put a bull here, or take it away and put back whatever it covered.
   *
   * The cycle reaches a bull through a dot, which means clearing one costs two more presses and
   * loses the dot on the way. Remembering the covered mark per cell is what makes this a *toggle*
   * rather than a third way to walk the cycle. `applyCellMarks` prunes the memory for any cell that
   * stops being a bull by any other route, so an undo or a `Backspace` cannot leave a stale one.
   */
  function handleToggleBull(cellIndex: number, interactionTimestampMs: number) {
    if (!level || isBoardLocked) {
      return
    }

    const currentMark = cellMarksRef.current[cellIndex]
    const coveredMarks = bullCoveredMarkRef.current
    const nextMark: CellMark =
      currentMark === 'bull' ? (coveredMarks.get(cellIndex) ?? 'empty') : 'bull'

    if (currentMark === 'bull') {
      coveredMarks.delete(cellIndex)
    } else {
      coveredMarks.set(cellIndex, currentMark)
    }

    startMusic('gameLoop')
    setActiveCellIndex(cellIndex)

    if (nextMark === 'bull' && !isGuest) {
      pendingBullPlacementsRef.current += 1
    }

    recordUndoSnapshot()
    applyCellMarks(
      level,
      cellMarksRef.current.map((mark, index) => (index === cellIndex ? nextMark : mark)),
      interactionTimestampMs,
    )
    playSoundEffect(
      nextMark === 'bull' ? 'placeBull' : nextMark === 'dot' ? 'placeDot' : 'clearCell',
    )
  }

  /**
   * `Backspace`: empty this cell whatever is in it.
   *
   * The one action with no pointer equivalent, and it earns its place — the cycle's only way out of
   * a bull is through `empty`, so "just clear this" otherwise costs one press from a dot and two
   * from a bull, and the player has to know which they are looking at.
   */
  function handleClearCell(cellIndex: number, interactionTimestampMs: number) {
    if (!level || isBoardLocked || cellMarksRef.current[cellIndex] === 'empty') {
      return
    }

    startMusic('gameLoop')
    setActiveCellIndex(cellIndex)
    recordUndoSnapshot()
    applyCellMarks(
      level,
      cellMarksRef.current.map((mark, index) => (index === cellIndex ? 'empty' : mark)),
      interactionTimestampMs,
    )
    playSoundEffect('clearCell')
  }

  function handleRestartBoard() {
    if (!level) {
      return
    }

    const emptyBoard = createEmptyBoard(level)

    clearMoveHistory()
    setCanUndo(false)
    bullCoveredMarkRef.current.clear()
    cellMarksRef.current = emptyBoard
    setCellMarks(emptyBoard)
    // The same four assignments this used to spell out. Restart and "the last mark came off" are
    // the same clock state, and they should not be able to drift apart.
    stopClock()
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

    if (isBoardEmpty(restoredMarks)) {
      // Undone all the way back to an empty board, which is the same state a restart leaves.
      stopClock()
    } else {
      /*
        Restore the *anchor*, and let the clock derive the reading from it.

        Ignoring the snapshot entirely left the timer frozen after undoing a completion, because
        `handleLevelSolved` clears the anchor — hence the `??`. But the displayed seconds used to be
        restored from the snapshot as well, and that is what made undo flicker: the reading jumped
        back to the time of the previous move and the ticking interval, which recomputes from the
        anchor every 250ms, immediately pulled it forward again.

        **Undo returns the board, not the time already spent.** Computing the reading from the
        restored anchor here rather than waiting for the next tick is what makes that true on screen
        as well as in the model — same number the interval is about to write, so nothing moves.
      */
      const restoredStartedAt = runStartedAtRef.current ?? previousMove.runStartedAt
      const restoredElapsed =
        restoredStartedAt === null
          ? previousMove.elapsedSeconds
          : Math.floor((Date.now() - restoredStartedAt) / 1000)

      elapsedSecondsRef.current = restoredElapsed
      runStartedAtRef.current = restoredStartedAt
      setElapsedSeconds(restoredElapsed)
      setRunStartedAt(restoredStartedAt)
    }

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
    canUndo,
    activeCellIndex,
    invalidBullIndexes: solutionState?.invalidBullIndexes ?? new Set<number>(),
    remainingBulls,
    handleCellPointerDown,
    handleCellPointerEnter,
    handleCellPointerUp,
    handleCellKeyDragStart,
    handleCellKeyDragEnter,
    handleCellKeyDragEnd,
    handleCellKeyDragCancel,
    handleClearCell,
    handleRestartBoard,
    handleUndoMove,
    handleCloseCompletionModal,
    handleRetrySaveCompletion,
    setCompletionModal,
  }
}
