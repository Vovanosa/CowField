import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useBlocker } from 'react-router-dom'

import { generateLevelDraft } from '../../game/levels'
import {
  createEmptyLevelDraft,
  deleteLevel,
  getDifficultyLevelSummary,
  getLevelByDifficultyAndNumber,
  saveLevel,
} from '../../game/storage/levelStorage'
import {
  getBullsPerGroupForDifficulty,
  validateLevelDraftAsync,
  type LevelValidationResult,
} from '../../game/validation'
import type { Difficulty, LevelDraft } from '../../game/types'
import {
  applyToolToDraft,
  createClearedDraft,
  createEditorDragState,
  createSuccessToast,
  createWarningToast,
  getNextLevelNumber,
  type ActiveTool,
  type DeleteDialogState,
  type ToastState,
} from './levelEditor.helpers'

type UseLevelEditorArgs = {
  difficulty: Difficulty
  routeLevelNumber?: number
  t: (key: string, options?: Record<string, unknown>) => string
}

/** An action that would discard the current draft, held until the user confirms it. */
type PendingDiscard = 'clear' | 'generate' | 'navigate'

export function useLevelEditor({ difficulty, routeLevelNumber, t }: UseLevelEditorArgs) {
  const [draft, setDraft] = useState<LevelDraft | null>(null)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [activeTool, setActiveTool] = useState<ActiveTool>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingDiscard, setPendingDiscard] = useState<PendingDiscard | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const dragStateRef = useRef(createEditorDragState())
  const isGeneratingRef = useRef(false)
  // A ref as well as state, for the same reason `isGenerating` has one: the guard has to hold
  // against a second click in the same tick, before React has re-rendered with the flag set.
  const isValidatingRef = useRef(false)

  // `t` is only needed for a fallback message, and its identity changes when the language changes.
  // Keeping it out of the load effect's deps matters: with it in there, switching language reloaded
  // the level and silently threw away the draft in progress.
  const translateRef = useRef(t)
  translateRef.current = t

  // In-app navigation away from an unsaved draft (the "Back to levels" link, the header, browser
  // back). `beforeunload` below only covers closing or reloading the tab.
  const blocker = useBlocker(hasUnsavedChanges)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setPendingDiscard('navigate')
    }
  }, [blocker.state])

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return
    }

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', warnBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    let isActive = true

    async function loadPageData() {
      try {
        if (routeLevelNumber) {
          const existingLevel = await getLevelByDifficultyAndNumber(difficulty, routeLevelNumber, {
            includeAuthoringData: true,
          })

          if (!isActive) {
            return
          }

          setDraft(existingLevel ?? createEmptyLevelDraft(difficulty, routeLevelNumber))
        } else {
          const levelSummary = await getDifficultyLevelSummary(difficulty)
          const nextLevelNumber = getNextLevelNumber(
            levelSummary.highestLevelNumber !== null ? [levelSummary.highestLevelNumber] : [],
          )

          if (!isActive) {
            return
          }

          setDraft(createEmptyLevelDraft(difficulty, nextLevelNumber))
        }

        setLoadError('')
        setToast(null)
        setActiveTool(1)
        setHasUnsavedChanges(false)
      } catch (error) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error ? error.message : translateRef.current('Failed to load level data.'),
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadPageData()

    return () => {
      isActive = false
    }
  }, [difficulty, routeLevelNumber])

  useEffect(() => {
    function stopDragging() {
      dragStateRef.current = createEditorDragState()
    }

    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 4500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toast])

  const colorOptions = draft
    ? Array.from({ length: draft.gridSize }, (_, index) => index + 1)
    : []

  const requiredCowCount = draft
    ? draft.gridSize * getBullsPerGroupForDifficulty(draft.difficulty)
    : 0

  function handleCellPaint(cellIndex: number) {
    setHasUnsavedChanges(true)
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return applyToolToDraft(currentDraft, cellIndex, activeTool)
    })
  }

  function handleCellPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    event.preventDefault()
    dragStateRef.current = {
      isPointerDown: true,
      visited: new Set([cellIndex]),
    }
    handleCellPaint(cellIndex)
  }

  function handleCellPointerEnter(cellIndex: number) {
    const dragState = dragStateRef.current

    if (!dragState.isPointerDown || dragState.visited.has(cellIndex)) {
      return
    }

    dragState.visited.add(cellIndex)
    handleCellPaint(cellIndex)
  }

  function handleCellPointerUp() {
    dragStateRef.current = {
      isPointerDown: false,
      visited: new Set<number>(),
    }
  }

  async function handleSave() {
    if (!draft) {
      return
    }

    if (isValidatingRef.current) {
      return
    }

    const nextDraft = draft satisfies LevelDraft
    const validationResult = await runValidation(nextDraft)

    if (!validationResult) {
      return
    }

    if (!validationResult.isValid) {
      setToast(createWarningToast(t('Fix those problems and try again.'), validationResult.issues))
      return
    }

    try {
      await saveLevel(nextDraft)
      setDraft(nextDraft)
      setHasUnsavedChanges(false)

      // Saving a multi-solution level is allowed, but say so — otherwise the only signal is a
      // player finishing it a way the author never intended.
      const solutionNote =
        validationResult.solutionCount !== null && validationResult.solutionCount > 1
          ? [describeSolutionCount(validationResult) ?? '']
          : undefined

      setToast(createSuccessToast(t('Level saved'), solutionNote))
    } catch (error) {
      setToast(createWarningToast(error instanceof Error ? error.message : t('Failed to save level.')))
    }
  }

  async function handleDelete(onDeleted: (difficulty: Difficulty) => void) {
    if (!deleteDialog || isDeleting) {
      return
    }

    setIsDeleting(true)
    setToast(null)

    try {
      await deleteLevel(deleteDialog.difficulty, deleteDialog.levelNumber)
      setDeleteDialog(null)
      onDeleted(deleteDialog.difficulty)
    } catch (error) {
      setToast(createWarningToast(error instanceof Error ? error.message : t('Failed to delete level.')))
      setIsDeleting(false)
    }
  }

  function clearBoard() {
    setHasUnsavedChanges(true)
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return createClearedDraft(currentDraft)
    })
    setToast(createSuccessToast(t('Board cleared')))
  }

  /**
   * Clear and Generate both overwrite the whole draft, and the editor has no undo — so when there
   * is unsaved work, ask first. With nothing unsaved there is nothing to lose, so don't nag.
   */
  function handleClearBoard() {
    if (hasUnsavedChanges) {
      setPendingDiscard('clear')
      return
    }

    clearBoard()
  }

  /**
   * How many ways the puzzle can be finished, phrased for the author. A level worth shipping has
   * exactly one solution; anything higher means players can reach the end a different way.
   */
  function describeSolutionCount(result: LevelValidationResult) {
    if (result.solutionCount === null) {
      return null
    }

    if (result.solutionCount === 1) {
      return t('Exactly one solution.')
    }

    return result.solutionCountReachedLimit
      ? t('Found {{count}}+ solutions. A good level has exactly one.', {
          count: result.solutionCount,
        })
      : t('Found {{count}} solutions. A good level has exactly one.', {
          count: result.solutionCount,
        })
  }

  /**
   * Runs the solution search in a worker and keeps the pending flag honest.
   *
   * Returns `null` when the run failed outright — the toast is already set, and both callers should
   * simply stop. Shared by Validate and Save so the two cannot disagree about what a draft is.
   */
  async function runValidation(nextDraft: LevelDraft) {
    isValidatingRef.current = true
    setIsValidating(true)

    try {
      return await validateLevelDraftAsync(nextDraft)
    } catch (error) {
      setToast(
        createWarningToast(
          error instanceof Error ? error.message : t('Failed to load level data.'),
        ),
      )
      return null
    } finally {
      isValidatingRef.current = false
      setIsValidating(false)
    }
  }

  async function handleValidate() {
    if (!draft || isValidatingRef.current) {
      return
    }

    const validationResult = await runValidation(draft)

    if (!validationResult) {
      return
    }

    if (!validationResult.isValid) {
      setToast(createWarningToast(t('Fix those problems and try again.'), validationResult.issues))
      return
    }

    // The rules pass, so the board is saveable either way — but a multi-solution level is a quality
    // problem the author should see rather than a silent pass.
    if (validationResult.solutionCount !== null && validationResult.solutionCount > 1) {
      setToast(
        createWarningToast(t('This level has more than one solution.'), [
          describeSolutionCount(validationResult) ?? '',
          t('Generate builds a level with exactly one solution.'),
        ]),
      )
      return
    }

    setToast(
      createSuccessToast(t('Validation passed'), [describeSolutionCount(validationResult) ?? '']),
    )
  }

  async function generateBoard() {
    if (!draft || isGeneratingRef.current) {
      return
    }

    const { difficulty: draftDifficulty, levelNumber } = draft

    setToast(null)
    setIsGenerating(true)
    isGeneratingRef.current = true

    // The search runs in a worker now, so the main thread stays free: the busy state paints and
    // animates, and the page keeps responding. It used to run here and freeze the tab for up to six
    // seconds on medium, which is why this needed a requestAnimationFrame just to get the label out
    // before the browser locked up.
    let generatedDraft: LevelDraft | null = null

    try {
      generatedDraft = await generateLevelDraft(
        levelNumber,
        t('Level {{levelNumber}}', { levelNumber }),
        draftDifficulty,
      )
    } finally {
      isGeneratingRef.current = false
      setIsGenerating(false)
    }

    if (!generatedDraft) {
      setToast(
        createWarningToast(t('Generation ran out of time. Try again.'), [
          t('The generator searches for a board with exactly one solution, which takes longer on medium and hard.'),
          t('Nothing on the board was changed, so you can run Generate again.'),
        ]),
      )
      return
    }

    setHasUnsavedChanges(true)
    setDraft(generatedDraft)
    setToast(createSuccessToast(t('Level generated'), [t('Exactly one solution.')]))
  }

  function handleGenerate() {
    if (hasUnsavedChanges) {
      setPendingDiscard('generate')
      return
    }

    void generateBoard()
  }

  function handleCancelDiscard() {
    if (pendingDiscard === 'navigate' && blocker.state === 'blocked') {
      blocker.reset()
    }

    setPendingDiscard(null)
  }

  function handleConfirmDiscard() {
    const action = pendingDiscard
    setPendingDiscard(null)

    if (action === 'clear') {
      clearBoard()
      return
    }

    if (action === 'generate') {
      void generateBoard()
      return
    }

    if (action === 'navigate' && blocker.state === 'blocked') {
      // Drop the guard before proceeding, or the blocker re-triggers on the same navigation.
      setHasUnsavedChanges(false)
      blocker.proceed()
    }
  }

  return {
    draft,
    loadError,
    toast,
    activeTool,
    isLoading,
    isDeleting,
    deleteDialog,
    colorOptions,
    requiredCowCount,
    hasUnsavedChanges,
    isGenerating,
    isValidating,
    pendingDiscard,
    handleCancelDiscard,
    handleConfirmDiscard,
    setActiveTool,
    setDeleteDialog,
    handleCellPointerDown,
    handleCellPointerEnter,
    handleCellPointerUp,
    handleSave,
    handleDelete,
    handleClearBoard,
    handleValidate,
    handleGenerate,
  }
}
