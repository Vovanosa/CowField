import type { Difficulty, LevelProgress } from '../types'

const GUEST_PROGRESS_STORAGE_KEY = 'cowfield.guest-level-progress'

type CompleteLevelResponse = {
  progress: LevelProgress
  isNewBest: boolean
}

type GuestProgressRecord = Record<string, LevelProgress>

function createProgressKey(difficulty: Difficulty, levelNumber: number) {
  return `${difficulty}:${levelNumber}`
}

function createEmptyProgress(difficulty: Difficulty, levelNumber: number): LevelProgress {
  return {
    difficulty,
    levelNumber,
    bestTimeSeconds: null,
    completedAt: null,
    updatedAt: '',
  }
}

function isLevelProgress(value: unknown): value is LevelProgress {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<LevelProgress>

  return (
    typeof candidate.difficulty === 'string' &&
    typeof candidate.levelNumber === 'number' &&
    (candidate.bestTimeSeconds === null || typeof candidate.bestTimeSeconds === 'number')
  )
}

function readGuestProgressRecord(): GuestProgressRecord {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    const parsed = JSON.parse(rawValue) as unknown

    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    // Validate every entry, not just the container. A single malformed entry used to reach
    // `progress.difficulty` on the levels page and throw.
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, value]) =>
        isLevelProgress(value),
      ),
    ) as GuestProgressRecord
  } catch {
    return {}
  }
}

/**
 * Returns false when the write could not be persisted — a full quota, or a browser with site data
 * blocked. Callers must not let that surface as "progress saved".
 */
function writeGuestProgressRecord(record: GuestProgressRecord) {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(record))
    return true
  } catch {
    return false
  }
}

export async function getGuestProgressByDifficulty(difficulty: Difficulty) {
  const record = readGuestProgressRecord()

  return Object.values(record)
    .filter((progress) => progress.difficulty === difficulty)
    .sort((left, right) => left.levelNumber - right.levelNumber)
}

export async function getGuestLevelProgress(difficulty: Difficulty, levelNumber: number) {
  const record = readGuestProgressRecord()

  return record[createProgressKey(difficulty, levelNumber)] ?? createEmptyProgress(difficulty, levelNumber)
}

export async function completeGuestLevelProgress(
  difficulty: Difficulty,
  levelNumber: number,
  timeSeconds: number,
): Promise<CompleteLevelResponse> {
  const record = readGuestProgressRecord()
  const progressKey = createProgressKey(difficulty, levelNumber)
  const existing = record[progressKey]
  const timestamp = new Date().toISOString()
  const isNewBest =
    existing?.bestTimeSeconds === null ||
    existing?.bestTimeSeconds === undefined ||
    timeSeconds < existing.bestTimeSeconds

  const progress: LevelProgress = {
    difficulty,
    levelNumber,
    bestTimeSeconds: isNewBest ? timeSeconds : (existing?.bestTimeSeconds ?? timeSeconds),
    completedAt: timestamp,
    updatedAt: timestamp,
  }

  const didPersist = writeGuestProgressRecord({
    ...record,
    [progressKey]: progress,
  })

  if (!didPersist) {
    // Surface it the same way a failed API write does, so the completion dialog can say so instead
    // of claiming the progress was saved.
    throw new Error('Could not save your progress on this device.')
  }

  return {
    progress,
    isNewBest,
  }
}
