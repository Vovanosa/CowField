import { FilePlayerProgressRepository } from '../repositories/FilePlayerProgressRepository'
import { FilePlayerStatisticsRepository } from '../repositories/FilePlayerStatisticsRepository'
import type { Difficulty } from '../types/level'
import type {
  DifficultyStatisticsSummary,
  PlayerStatisticsSummary,
} from '../types/statistics'

const difficulties: Difficulty[] = ['light', 'easy', 'medium', 'hard']

export class PlayerStatisticsService {
  private readonly progressRepository: FilePlayerProgressRepository
  private readonly statisticsRepository: FilePlayerStatisticsRepository

  constructor(
    progressRepository: FilePlayerProgressRepository,
    statisticsRepository: FilePlayerStatisticsRepository,
  ) {
    this.progressRepository = progressRepository
    this.statisticsRepository = statisticsRepository
  }

  async getSummary(actorKey: string): Promise<PlayerStatisticsSummary> {
    const [allProgress, statisticsRecord] = await Promise.all([
      this.progressRepository.listAll(actorKey),
      this.statisticsRepository.get(actorKey),
    ])

    const completedProgress = allProgress.filter((progress) => progress.bestTimeSeconds !== null)
    const byDifficulty = difficulties.map<DifficultyStatisticsSummary>((difficulty) => {
      const completedForDifficulty = completedProgress.filter(
        (progress) => progress.difficulty === difficulty,
      )
      const fastestProgress = completedForDifficulty.reduce<typeof completedForDifficulty[number] | null>(
        (currentFastest, progress) => {
          if (
            currentFastest === null ||
            (progress.bestTimeSeconds ?? Number.POSITIVE_INFINITY) <
              (currentFastest.bestTimeSeconds ?? Number.POSITIVE_INFINITY)
          ) {
            return progress
          }

          return currentFastest
        },
        null,
      )
      const totalDifficultyTime = completedForDifficulty.reduce(
        (total, progress) => total + (progress.bestTimeSeconds ?? 0),
        0,
      )

      return {
        difficulty,
        completedLevels: completedForDifficulty.length,
        fastestLevel: fastestProgress
          ? {
              levelNumber: fastestProgress.levelNumber,
              timeSeconds: fastestProgress.bestTimeSeconds ?? 0,
            }
          : null,
        averageTimeSeconds:
          completedForDifficulty.length > 0
            ? Math.round(totalDifficultyTime / completedForDifficulty.length)
            : null,
      }
    })

    return {
      totalCompletedLevels: completedProgress.length,
      totalBullPlacements: statisticsRecord.totalBullPlacements,
      totalCompletionTimeSeconds: completedProgress.reduce(
        (total, progress) => total + (progress.bestTimeSeconds ?? 0),
        0,
      ),
      byDifficulty,
    }
  }

  async recordBullPlacement(actorKey: string) {
    const currentStatistics = await this.statisticsRepository.get(actorKey)
    const nextStatistics = {
      totalBullPlacements: currentStatistics.totalBullPlacements + 1,
      updatedAt: new Date().toISOString(),
    }

    await this.statisticsRepository.save(actorKey, nextStatistics)

    return {
      totalBullPlacements: nextStatistics.totalBullPlacements,
    }
  }
}
