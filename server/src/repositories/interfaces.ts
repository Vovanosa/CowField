import type { SessionRecord, UserRecord } from '../types/auth'
import type {
  Difficulty,
  LevelDifficultySummaryRecord,
  LevelCatalogueRecord,
  LevelsOverviewRecord,
  LevelRecord,
} from '../types/level'
import type {
  BestTimesByLevelRecord,
  DifficultyProgressSummaryRecord,
  LevelProgressRecord,
  ProgressStatisticsSummaries,
} from '../types/progress'
import type { PlayerStatisticsRecord } from '../types/statistics'

export interface UserRepository {
  listAll(): Promise<UserRecord[]>
  getByEmail(email: string): Promise<UserRecord | null>
  getById(id: string): Promise<UserRecord | null>
  save(user: UserRecord): Promise<UserRecord>
}

export interface SessionRepository {
  /**
   * Returns `null` for an expired session as well as a missing one, and deletes the expired row as
   * it goes. Does **not** write on a successful lookup.
   */
  getByToken(token: string): Promise<SessionRecord | null>
  save(session: SessionRecord): Promise<SessionRecord>
  deleteByToken(token: string): Promise<void>
  /** Bulk sweep of everything already expired. Returns the number of rows deleted. */
  deleteExpired(now?: Date): Promise<number>
}

export interface PlayerProgressRepository {
  /** A difficulty's best times keyed by level number, completed levels only. */
  getBestTimesByDifficulty(
    actorKey: string,
    difficulty: Difficulty,
  ): Promise<BestTimesByLevelRecord>
  /**
   * Several specific levels in one query. It took two — the level being completed and the one before
   * it — until P18 removed level locking and the ordering guard with it; `completeLevel` now asks
   * for one. The plural shape is kept because the guest-progress import (P18 workstream C) needs it.
   */
  listByLevelNumbers(
    actorKey: string,
    difficulty: Difficulty,
    levelNumbers: number[],
  ): Promise<LevelProgressRecord[]>
  /** All four difficulties in one query. */
  getDifficultySummaries(actorKey: string): Promise<DifficultyProgressSummaryRecord[]>
  /**
   * Everything the statistics page needs from `level_progress`, in two queries rather than nine.
   * The overall total is summed from the same `groupBy`, so it costs nothing extra.
   */
  getStatisticsSummaries(actorKey: string): Promise<ProgressStatisticsSummaries>
  getByDifficultyAndNumber(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
  ): Promise<LevelProgressRecord | null>
  save(actorKey: string, progress: LevelProgressRecord): Promise<LevelProgressRecord>
  /**
   * A guest's local record, adopted by the account they just created (P18, decision D5). One
   * transaction, never a loop over `saveCompletion`, and the merge keeps the better time.
   */
  importCompletions(
    actorKey: string,
    entries: Array<{ difficulty: Difficulty; levelNumber: number; timeSeconds: number }>,
  ): Promise<{ importedCount: number }>
  /**
   * Records a completion: the progress row **and** the lifetime counters, in one transaction.
   *
   * They used to be three separate writes across two HTTP requests — the progress upsert, a
   * `total_completion_time_seconds` increment beside it, and a `total_bull_placements` increment
   * from a parallel `POST /api/statistics/bull-placement`. Nothing tied them together, so a failure
   * between them left a completion recorded with no time counted, or the reverse.
   */
  saveCompletion(
    actorKey: string,
    completion: {
      progress: LevelProgressRecord
      timeSeconds: number
      bullPlacements: number
    },
  ): Promise<LevelProgressRecord>
}

export interface PlayerStatisticsRepository {
  get(actorKey: string): Promise<PlayerStatisticsRecord>
  /** Atomic add to the lifetime bull counter. Returns the new total (0 for actors with no row). */
  incrementBullPlacements(actorKey: string, count: number): Promise<number>
  /**
   * Atomic add to the lifetime **time played** counter. Every completion counts, replays included,
   * so this only ever grows. Returns the new total (0 for actors with no row).
   */
  addCompletionTimeSeconds(actorKey: string, seconds: number): Promise<number>
}

export interface LevelRepository {
  getDifficultySummary(difficulty: Difficulty): Promise<LevelDifficultySummaryRecord>
  getOverview(): Promise<LevelsOverviewRecord>
  /**
   * The whole catalogue for a difficulty. There is no paging: the client caches this for the
   * session, ~25KB, and the `page`/`limit` path that existed here was never called by anything.
   */
  listByDifficulty(difficulty: Difficulty): Promise<LevelCatalogueRecord>
  getByDifficultyAndNumber(difficulty: Difficulty, levelNumber: number): Promise<LevelRecord | null>
  /**
   * The level, plus the numbers of its neighbours in this difficulty's ordered list — **one query**
   * for what used to be a `findUnique` plus a `count` plus two `findFirst`s.
   *
   * Neither neighbour is `levelNumber ± 1`: deleting a level leaves gaps, and both unlock order and
   * the "Next Level" button follow the list rather than the numbering.
   */
  getByDifficultyAndNumberWithNeighbours(
    difficulty: Difficulty,
    levelNumber: number,
  ): Promise<{
    level: LevelRecord | null
    previousLevelNumber: number | null
    nextLevelNumber: number | null
  }>
  /**
   * The neighbours alone, without loading the board. For `completeLevel` (which only needs to know
   * the level exists — the ordering guard that wanted `previousLevelNumber` went in P18) and for a
   * save (which needs what follows it).
   */
  getNeighbourLevelNumbers(
    difficulty: Difficulty,
    levelNumber: number,
  ): Promise<{
    exists: boolean
    previousLevelNumber: number | null
    nextLevelNumber: number | null
  }>
  /**
   * `createdByActorKey` records who authored the level. It is written **only when the row is
   * created** — the original author of a level does not change because someone edited it later.
   * Omit it for machine-authored levels (the bulk generator has no user behind it).
   */
  save(level: LevelRecord, options?: { createdByActorKey?: string }): Promise<LevelRecord>
  /**
   * Saves a batch of levels in **one transaction**, so a batch can never land half-written.
   *
   * `replacedLevelNumbers` are levels whose board is being overwritten: their `level_progress` rows
   * are deleted in the same transaction. That is not optional — progress keys on
   * `(difficulty, levelNumber)` with no foreign key to `levels`, so a recorded best time would
   * otherwise survive onto a board nobody has solved.
   */
  saveMany(
    levels: LevelRecord[],
    options?: { replacedLevelNumbers?: number[] },
  ): Promise<{ savedCount: number; deletedProgressCount: number }>
  delete(difficulty: Difficulty, levelNumber: number): Promise<boolean>
}

export type AppRepositories = {
  levelRepository: LevelRepository
  playerProgressRepository: PlayerProgressRepository
  playerStatisticsRepository: PlayerStatisticsRepository
  sessionRepository: SessionRepository
  userRepository: UserRepository
}
