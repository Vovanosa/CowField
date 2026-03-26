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

function readGuestProgressRecord(): GuestProgressRecord {
  if (typeof window === 'undefined') {
    return {}
  }

  const rawValue = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue) as GuestProgressRecord
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeGuestProgressRecord(record: GuestProgressRecord) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(record))
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

  writeGuestProgressRecord({
    ...record,
    [progressKey]: progress,
  })

  return {
    progress,
    isNewBest,
  }
}
