import type { Difficulty } from '../types/level'
import type {
  PlayerStatisticsSummary,
} from '../types/statistics'
import type {
  PlayerProgressRepository,
  PlayerStatisticsRepository,
} from '../repositories/interfaces'

const difficulties: Difficulty[] = ['light', 'easy', 'medium', 'hard']

export class PlayerStatisticsService {
  private readonly progressRepository: PlayerProgressRepository
  private readonly statisticsRepository: PlayerStatisticsRepository

  constructor(
    progressRepository: PlayerProgressRepository,
    statisticsRepository: PlayerStatisticsRepository,
  ) {
    this.progressRepository = progressRepository
    this.statisticsRepository = statisticsRepository
  }

  async getSummary(actorKey: string): Promise<PlayerStatisticsSummary> {
    const [statisticsRecord, overallSummary, byDifficulty] = await Promise.all([
      this.statisticsRepository.get(actorKey),
      this.progressRepository.getOverallStatisticsSummary(actorKey),
      Promise.all(
        difficulties.map((difficulty) =>
          this.progressRepository.getDifficultyStatisticsSummary(actorKey, difficulty),
        ),
      ),
    ])

    return {
      totalCompletedLevels: overallSummary.totalCompletedLevels,
      totalBullPlacements: statisticsRecord.totalBullPlacements,
      totalCompletionTimeSeconds: overallSummary.totalCompletionTimeSeconds,
      byDifficulty,
    }
  }

  async recordBullPlacements(actorKey: string, count: number) {
    const currentStatistics = await this.statisticsRepository.get(actorKey)
    const nextStatistics = {
      totalCompletedLevels: currentStatistics.totalCompletedLevels,
      totalBullPlacements: currentStatistics.totalBullPlacements + count,
      totalCompletionTimeSeconds: currentStatistics.totalCompletionTimeSeconds,
      byDifficulty: currentStatistics.byDifficulty,
      updatedAt: new Date().toISOString(),
    }

    await this.statisticsRepository.save(actorKey, nextStatistics)

    return {
      totalBullPlacements: nextStatistics.totalBullPlacements,
    }
  }
}
