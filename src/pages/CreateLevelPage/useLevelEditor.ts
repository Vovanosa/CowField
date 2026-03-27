import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { generateLevelDraft } from '../../game/levels'
import {
  createEmptyLevelDraft,
  deleteLevel,
  getLevelByDifficultyAndNumber,
  getLevelsByDifficulty,
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

export function useLevelEditor({ difficulty, routeLevelNumber, t }: UseLevelEditorArgs) {
  const [draft, setDraft] = useState<LevelDraft | null>(null)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [activeTool, setActiveTool] = useState<ActiveTool>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null)
  const dragStateRef = useRef(createEditorDragState())

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
          const levels = await getLevelsByDifficulty(difficulty)
          const nextLevelNumber = getNextLevelNumber(levels.map((level) => level.levelNumber))

          if (!isActive) {
            return
          }

          setDraft(createEmptyLevelDraft(difficulty, nextLevelNumber))
        }

        setLoadError('')
        setToast(null)
        setActiveTool(1)
      } catch (error) {
        if (!isActive) {
          return
        }

        setLoadError(error instanceof Error ? error.message : t('Failed to load level data.'))
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
  }, [difficulty, routeLevelNumber, t])

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

  function handleClearBoard() {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return createClearedDraft(currentDraft)
    })
    setToast(createSuccessToast(t('Board cleared')))
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

  function handleGenerate() {
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
          t('Switch to light, easy, or medium to use automatic generation.'),
          [
            t('Automatic generation is currently implemented for light, easy, and medium only.'),
            t('The generator builds a full draft by placing one legal cow in each row and column, then growing connected color regions around those seed cells.'),
            t('If a generated draft does not pass the validator, the generator retries automatically until it finds a legal result or gives up.'),
          ],
        ),
      )
      return
    }

    setDraft(generatedDraft)
    setToast(createSuccessToast(t('Level generated')))
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
