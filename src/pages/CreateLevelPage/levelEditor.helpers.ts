import type { Difficulty, LevelDraft } from '../../game/types'

export const cowTool = 'cow' as const
export type ActiveTool = number | typeof cowTool

export type ToastState = {
  variant: 'success' | 'warning'
  title: string
  details?: string[]
}

export type DeleteDialogState = {
  difficulty: Difficulty
  levelNumber: number
} | null

export type EditorDragState = {
  isPointerDown: boolean
  visited: Set<number>
}

export function createEditorDragState(): EditorDragState {
  return {
    isPointerDown: false,
    visited: new Set<number>(),
  }
}

export function applyToolToDraft(
  draft: LevelDraft,
  cellIndex: number,
  activeTool: ActiveTool,
): LevelDraft {
  const nextColors = [...draft.pensByCell]
  const nextCows = [...draft.cowsByCell]

  if (activeTool === cowTool) {
    nextCows[cellIndex] = !nextCows[cellIndex]
  } else if (activeTool === 0) {
    nextColors[cellIndex] = 0
    nextCows[cellIndex] = false
  } else {
    nextColors[cellIndex] = activeTool
  }

  return {
    ...draft,
    pensByCell: nextColors,
    cowsByCell: nextCows,
  }
}

export function createClearedDraft(draft: LevelDraft): LevelDraft {
  return {
    ...draft,
    pensByCell: Array.from({ length: draft.gridSize * draft.gridSize }, () => 0),
    cowsByCell: Array.from({ length: draft.gridSize * draft.gridSize }, () => false),
  }
}

export function getNextLevelNumber(levelNumbers: number[]) {
  return levelNumbers.length > 0 ? Math.max(...levelNumbers) + 1 : 1
}

/** Drops blank lines so a caller can pass an optional detail without guarding it first. */
function cleanDetails(details?: string[]) {
  const kept = details?.filter((detail) => detail.trim().length > 0)

  return kept && kept.length > 0 ? kept : undefined
}

export function createWarningToast(title: string, details?: string[]): ToastState {
  return {
    variant: 'warning',
    title,
    details: cleanDetails(details),
  }
}

export function createSuccessToast(title: string, details?: string[]): ToastState {
  return {
    variant: 'success',
    title,
    details: cleanDetails(details),
  }
}
