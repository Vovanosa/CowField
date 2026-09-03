import type { CellMark } from '../types'

type MoveHistoryEntry = {
  cellMarks: CellMark[]
  elapsedSeconds: number
  runStartedAt: number | null
}

/**
 * Undo depth. Each entry holds a whole board (up to 100 cells), so the stack needs a ceiling.
 */
const MAX_MOVE_HISTORY_ENTRIES = 60

/**
 * In memory only, deliberately.
 *
 * This used to mirror every move into localStorage, which cost a full read + parse + stringify +
 * write per tap (quadratic over a long game), shared one key across tabs so undo in one tab could
 * restore another tab's board, and could throw QuotaExceededError straight out of the board's click
 * handler — leaving the board unresponsive. The mirror bought nothing either way: the stack is
 * cleared whenever a level loads, and the board itself is never persisted, so a restored history
 * would not have matched the fresh empty board anyway.
 */
let history: MoveHistoryEntry[] = []

export function clearMoveHistory() {
  history = []
}

export function getMoveHistoryCount() {
  return history.length
}

export function pushMoveHistoryEntry(entry: MoveHistoryEntry) {
  history.push(entry)

  if (history.length > MAX_MOVE_HISTORY_ENTRIES) {
    history.splice(0, history.length - MAX_MOVE_HISTORY_ENTRIES)
  }
}

export function popMoveHistoryEntry() {
  return history.pop() ?? null
}
