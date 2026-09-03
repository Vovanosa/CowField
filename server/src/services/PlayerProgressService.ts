import { HttpError } from '../errors/HttpError'
import type { CompleteLevelInput } from '../schemas/progressSchemas'
import type { Difficulty } from '../types/level'
import type { LevelRepository, PlayerProgressRepository } from '../repositories/interfaces'
import type { ProgressOverviewRecord } from '../types/progress'

const levelsOverviewDifficulties: Difficulty[] = ['light', 'easy', 'medium', 'hard']

/**
 * Guests never get backend progress rows — their progress is client-local — so the ownership and
 * unlock checks below have nothing to verify against for them.
 */
function isGuestActor(actorKey: string) {
  return actorKey.startsWith('guest:')
}

function createEmptyProgress(difficulty: Difficulty, levelNumber: number) {
  return {
    difficulty,
    levelNumber,
    bestTimeSeconds: null,
    completedAt: null,
    updatedAt: '',
  }
}

export class PlayerProgressService {
  private readonly repository: PlayerProgressRepository
  private readonly levelRepository: LevelRepository

  constructor(repository: PlayerProgressRepository, levelRepository: LevelRepository) {
    this.repository = repository
    this.levelRepository = levelRepository
  }

  async getDifficultySummary(actorKey: string, difficulty: Difficulty) {
    return this.repository.getDifficultySummary(actorKey, difficulty)
  }

  async getOverview(actorKey: string): Promise<ProgressOverviewRecord> {
    const levelsOverviewPromise = this.levelRepository.getOverview()
    const progressSummariesPromise = Promise.all(
      levelsOverviewDifficulties.map((difficulty) =>
        this.repository.getDifficultySummary(actorKey, difficulty),
      ),
    )
    const [levelsOverview, progressSummaries] = await Promise.all([
      levelsOverviewPromise,
      progressSummariesPromise,
    ])

    const progressByDifficulty = new Map(
      progressSummaries.map((summary) => [summary.difficulty, summary.completedCount]),
    )

    return {
      difficulties: levelsOverview.difficulties.map((summary) => ({
        difficulty: summary.difficulty,
        totalCount: summary.totalCount,
        completedCount: progressByDifficulty.get(summary.difficulty) ?? 0,
      })),
    }
  }

  async listByDifficulty(actorKey: string, difficulty: Difficulty) {
    return this.repository.listByDifficulty(actorKey, difficulty)
  }

  async getByDifficultyAndNumber(actorKey: string, difficulty: Difficulty, levelNumber: number) {
    return (
      (await this.repository.getByDifficultyAndNumber(actorKey, difficulty, levelNumber)) ??
      createEmptyProgress(difficulty, levelNumber)
    )
  }

  /**
   * Rejects a completion the player could not legitimately have reached.
   *
   * The client enforces unlock order too (`src/game/progression.ts`), but that is a UX affordance,
   * not a guarantee — this endpoint is reachable directly.
   */
  private async assertCompletionIsReachable(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
  ) {
    const level = await this.levelRepository.getByDifficultyAndNumber(difficulty, levelNumber)

    if (!level) {
      throw new HttpError(404, 'Level not found.')
    }

    if (isGuestActor(actorKey)) {
      return
    }

    const previousLevelNumber = await this.levelRepository.getPreviousLevelNumber(
      difficulty,
      levelNumber,
    )

    if (previousLevelNumber === null) {
      return
    }

    const previousProgress = await this.repository.getByDifficultyAndNumber(
      actorKey,
      difficulty,
      previousLevelNumber,
    )

    if (previousProgress?.bestTimeSeconds == null) {
      throw new HttpError(403, 'Finish the previous level first.')
    }
  }

  async completeLevel(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
    input: CompleteLevelInput,
  ) {
    await this.assertCompletionIsReachable(actorKey, difficulty, levelNumber)

    const existing = await this.repository.getByDifficultyAndNumber(
      actorKey,
      difficulty,
      levelNumber,
    )
    const timestamp = new Date().toISOString()
    const isNewBest =
      existing?.bestTimeSeconds === null ||
      existing?.bestTimeSeconds === undefined ||
      input.timeSeconds < existing.bestTimeSeconds

    const progress = await this.repository.save(actorKey, {
      difficulty,
      levelNumber,
      bestTimeSeconds: isNewBest ? input.timeSeconds : (existing?.bestTimeSeconds ?? input.timeSeconds),
      completedAt: timestamp,
      updatedAt: timestamp,
    })

    return {
      progress,
      isNewBest,
    }
  }
}

