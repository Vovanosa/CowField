type MoveHistoryEntry = {
  cellMarks: string[]
  elapsedSeconds: number
  runStartedAt: number | null
}

const MOVE_HISTORY_STORAGE_KEY = 'bullpen:move-history'

function isMoveHistoryEntry(value: unknown): value is MoveHistoryEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {
    cellMarks?: unknown
    elapsedSeconds?: unknown
    runStartedAt?: unknown
  }

  return (
    Array.isArray(candidate.cellMarks) &&
    typeof candidate.elapsedSeconds === 'number' &&
    (typeof candidate.runStartedAt === 'number' || candidate.runStartedAt === null)
  )
}

function readMoveHistory() {
  if (typeof window === 'undefined') {
    return [] as MoveHistoryEntry[]
  }

  try {
    const rawValue = window.localStorage.getItem(MOVE_HISTORY_STORAGE_KEY)

    if (!rawValue) {
      return [] as MoveHistoryEntry[]
    }

    const parsed = JSON.parse(rawValue) as unknown

    if (!Array.isArray(parsed)) {
      return [] as MoveHistoryEntry[]
    }

    return parsed.filter(isMoveHistoryEntry)
  } catch {
    return [] as MoveHistoryEntry[]
  }
}

function writeMoveHistory(history: MoveHistoryEntry[]) {
  if (typeof window === 'undefined') {
    return
  }

  if (history.length === 0) {
    window.localStorage.removeItem(MOVE_HISTORY_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(MOVE_HISTORY_STORAGE_KEY, JSON.stringify(history))
}

export function clearMoveHistory() {
  writeMoveHistory([])
}

export function getMoveHistoryCount() {
  return readMoveHistory().length
}

export function pushMoveHistoryEntry(entry: MoveHistoryEntry) {
  const history = readMoveHistory()
  history.push(entry)
  writeMoveHistory(history)
}

export function popMoveHistoryEntry() {
  const history = readMoveHistory()
  const entry = history.pop() ?? null
  writeMoveHistory(history)
  return entry
}
