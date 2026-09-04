import type { PlayerStatisticsSummary } from '../types/statistics'
import type {
  PlayerProgressRepository,
  PlayerStatisticsRepository,
} from '../repositories/interfaces'

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

  /**
   * Three queries, down from ten.
   *
   * The nine `level_progress` reads this used to fan out (one overall count plus an `aggregate` and
   * a `findFirst` per difficulty) are now two inside `getStatisticsSummaries`.
   */
  async getSummary(actorKey: string): Promise<PlayerStatisticsSummary> {
    const [statisticsRecord, progressSummaries] = await Promise.all([
      this.statisticsRepository.get(actorKey),
      this.progressRepository.getStatisticsSummaries(actorKey),
    ])

    return {
      totalCompletedLevels: progressSummaries.totalCompletedLevels,
      totalBullPlacements: statisticsRecord.totalBullPlacements,
      totalCompletionTimeSeconds: statisticsRecord.totalCompletionTimeSeconds,
      byDifficulty: progressSummaries.byDifficulty,
    }
  }

  async recordBullPlacements(actorKey: string, count: number) {
    const totalBullPlacements = await this.statisticsRepository.incrementBullPlacements(
      actorKey,
      count,
    )

    return {
      totalBullPlacements,
    }
  }
}
