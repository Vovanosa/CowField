import type { CompleteLevelInput } from '../schemas/progressSchemas'
import type { Difficulty } from '../types/level'
import type { LevelRepository, PlayerProgressRepository } from '../repositories/interfaces'
import type { ProgressOverviewRecord } from '../types/progress'

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

  async completeLevel(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
    input: CompleteLevelInput,
  ) {
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

const levelsOverviewDifficulties: Difficulty[] = ['light', 'easy', 'medium', 'hard']
