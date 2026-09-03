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
import { getBullsPerGroupForDifficulty, validateLevelDraft } from '../../game/validation'
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
  const dragStateRef = useRef(createEditorDragState())

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

    const nextDraft = draft satisfies LevelDraft
    const validationResult = validateLevelDraft(nextDraft)

    if (!validationResult.isValid) {
      setToast(createWarningToast(t('Fix those problems and try again.'), validationResult.issues))
      return
    }

    try {
      await saveLevel(nextDraft)
      setDraft(nextDraft)
      setHasUnsavedChanges(false)
      setToast(createSuccessToast(t('Level saved')))
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

  function handleValidate() {
    if (!draft) {
      return
    }

    const validationResult = validateLevelDraft(draft)

    if (validationResult.isValid) {
      setToast(createSuccessToast(t('Validation passed')))
      return
    }

    setToast(createWarningToast(t('Fix those problems and try again.'), validationResult.issues))
  }

  function generateBoard() {
    if (!draft) {
      return
    }

    setToast(null)

    const generatedDraft = generateLevelDraft(
      draft.levelNumber,
      t('Level {{levelNumber}}', { levelNumber: draft.levelNumber }),
      draft.difficulty,
    )

    if (!generatedDraft) {
      setToast(
        createWarningToast(
          difficulty === 'hard'
            ? t('Automatic hard generation could not find a valid draft. Try again.')
            : t('Switch to light, easy, or medium to use automatic generation.'),
          [
            difficulty === 'hard'
              ? t('Hard generation now searches for a legal 20-bull layout first, then grows 10 connected pens around those row seed pairs.')
              : t('Automatic generation is currently implemented for light, easy, and medium only.'),
            difficulty === 'hard'
              ? t('Because hard needs 2 bulls in every row, column, and pen, generation can take longer and some attempts will be discarded by the validator.')
              : t('The generator builds a full draft by placing one legal cow in each row and column, then growing connected color regions around those seed cells.'),
            difficulty === 'hard'
              ? t('If a generated hard draft does not pass the validator, the generator retries automatically until it finds a legal result or gives up.')
              : t('If a generated draft does not pass the validator, the generator retries automatically until it finds a legal result or gives up.'),
          ],
        ),
      )
      return
    }

    setHasUnsavedChanges(true)
    setDraft(generatedDraft)
    setToast(createSuccessToast(t('Level generated')))
  }

  function handleGenerate() {
    if (hasUnsavedChanges) {
      setPendingDiscard('generate')
      return
    }

    generateBoard()
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
      generateBoard()
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
