import type {
  PasswordResetTokenRecord,
  SessionRecord,
  UserRecord,
} from '../types/auth'
import type { Difficulty, LevelRecord, LevelSummaryRecord } from '../types/level'
import type { LevelProgressRecord } from '../types/progress'
import type { PlayerSettingsRecord } from '../types/settings'
import type { PlayerStatisticsRecord } from '../types/statistics'

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
}

export interface PasswordResetTokenRepository {
  save(record: PasswordResetTokenRecord): Promise<PasswordResetTokenRecord>
  getByToken(token: string): Promise<PasswordResetTokenRecord | null>
  deleteById(id: string): Promise<void>
}

export interface PlayerSettingsRepository {
  get(actorKey: string): Promise<PlayerSettingsRecord>
  save(actorKey: string, record: PlayerSettingsRecord): Promise<PlayerSettingsRecord>
}

export interface PlayerProgressRepository {
  listByDifficulty(actorKey: string, difficulty: Difficulty): Promise<LevelProgressRecord[]>
  listAll(actorKey: string): Promise<LevelProgressRecord[]>
  getByDifficultyAndNumber(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
  ): Promise<LevelProgressRecord | null>
  save(actorKey: string, progress: LevelProgressRecord): Promise<LevelProgressRecord>
}

export interface PlayerStatisticsRepository {
  get(actorKey: string): Promise<PlayerStatisticsRecord>
  save(actorKey: string, record: PlayerStatisticsRecord): Promise<PlayerStatisticsRecord>
}

export interface LevelRepository {
  listByDifficulty(difficulty: Difficulty): Promise<LevelSummaryRecord[]>
  getByDifficultyAndNumber(difficulty: Difficulty, levelNumber: number): Promise<LevelRecord | null>
  save(level: LevelRecord): Promise<LevelRecord>
  delete(difficulty: Difficulty, levelNumber: number): Promise<boolean>
  getNextLevelNumber(difficulty: Difficulty): Promise<number>
  exists(): Promise<boolean>
}

export type AppRepositories = {
  levelRepository: LevelRepository
  passwordResetTokenRepository: PasswordResetTokenRepository
  playerProgressRepository: PlayerProgressRepository
  playerSettingsRepository: PlayerSettingsRepository
  playerStatisticsRepository: PlayerStatisticsRepository
  sessionRepository: SessionRepository
  userRepository: UserRepository
}
