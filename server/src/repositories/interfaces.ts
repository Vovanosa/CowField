import type { SessionRecord, UserRecord } from '../types/auth'
import type {
  Difficulty,
  LevelDifficultySummaryRecord,
  LevelListPageRecord,
  LevelsOverviewRecord,
  LevelRecord,
} from '../types/level'
import type {
  DifficultyProgressSummaryRecord,
  LevelProgressRecord,
  OverallProgressStatisticsSummary,
} from '../types/progress'
import type {
  DifficultyStatisticsSummary,
  PlayerStatisticsRecord,
} from '../types/statistics'

export interface UserRepository {
  listAll(): Promise<UserRecord[]>
  getByEmail(email: string): Promise<UserRecord | null>
  getById(id: string): Promise<UserRecord | null>
  getByGoogleId(googleId: string): Promise<UserRecord | null>
  save(user: UserRecord): Promise<UserRecord>
}

export interface SessionRepository {
  getByToken(token: string): Promise<SessionRecord | null>
  save(session: SessionRecord): Promise<SessionRecord>
  deleteByToken(token: string): Promise<void>
  deleteByAccountUserId(accountUserId: string): Promise<void>
}

export interface PlayerProgressRepository {
  listByDifficulty(actorKey: string, difficulty: Difficulty): Promise<LevelProgressRecord[]>
  getDifficultySummary(
    actorKey: string,
    difficulty: Difficulty,
  ): Promise<DifficultyProgressSummaryRecord>
  getDifficultyStatisticsSummary(
    actorKey: string,
    difficulty: Difficulty,
  ): Promise<DifficultyStatisticsSummary>
  getOverallStatisticsSummary(actorKey: string): Promise<OverallProgressStatisticsSummary>
  getByDifficultyAndNumber(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
  ): Promise<LevelProgressRecord | null>
  save(actorKey: string, progress: LevelProgressRecord): Promise<LevelProgressRecord>
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
  listByDifficulty(
    difficulty: Difficulty,
    options?: {
      page?: number
      limit?: number
    },
  ): Promise<LevelListPageRecord>
  getByDifficultyAndNumber(difficulty: Difficulty, levelNumber: number): Promise<LevelRecord | null>
  /**
   * The level immediately before `levelNumber` in this difficulty's ordered list, or null if
   * `levelNumber` is the first. Not `levelNumber - 1`: deleting a level leaves gaps, and unlock
   * order follows the list, not the numbering.
   */
  getPreviousLevelNumber(difficulty: Difficulty, levelNumber: number): Promise<number | null>
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
  exists(): Promise<boolean>
}

export type AppRepositories = {
  levelRepository: LevelRepository
  playerProgressRepository: PlayerProgressRepository
  playerStatisticsRepository: PlayerStatisticsRepository
  sessionRepository: SessionRepository
  userRepository: UserRepository
}
