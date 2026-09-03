import { Difficulty, type PrismaClient } from '@prisma/client'

import type { Difficulty as AppDifficulty } from '../types/level'
import type {
  DifficultyProgressSummaryRecord,
  LevelProgressRecord,
  OverallProgressStatisticsSummary,
} from '../types/progress'
import type { DifficultyStatisticsSummary } from '../types/statistics'
import type { PlayerProgressRepository } from './interfaces'
import { resolveActorReference } from './prismaActor'

function toPrismaDifficulty(difficulty: AppDifficulty): Difficulty {
  return difficulty as Difficulty
}

function toLevelProgressRecord(progress: {
  difficulty: Difficulty
  levelNumber: number
  bestTimeSeconds: number | null
  completedAt: Date | null
  updatedAt: Date
}): LevelProgressRecord {
  return {
    difficulty: progress.difficulty,
    levelNumber: progress.levelNumber,
    bestTimeSeconds: progress.bestTimeSeconds,
    completedAt: progress.completedAt?.toISOString() ?? null,
    updatedAt: progress.updatedAt.toISOString(),
  }
}

export class PrismaPlayerProgressRepository implements PlayerProgressRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async getDifficultySummary(
    actorKey: string,
    difficulty: AppDifficulty,
  ): Promise<DifficultyProgressSummaryRecord> {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return {
        difficulty,
        completedCount: 0,
      }
    }

    const completedCount = await this.prisma.levelProgress.count({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        userId: actor.userId,
        bestTimeSeconds: {
          not: null,
        },
      },
    })

    return {
      difficulty,
      completedCount,
    }
  }

  async getDifficultyStatisticsSummary(
    actorKey: string,
    difficulty: AppDifficulty,
  ): Promise<DifficultyStatisticsSummary> {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return {
        difficulty,
        completedLevels: 0,
        fastestLevel: null,
        averageTimeSeconds: null,
      }
    }

    const [aggregate, fastestRecord] = await Promise.all([
      this.prisma.levelProgress.aggregate({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
          userId: actor.userId,
          bestTimeSeconds: {
            not: null,
          },
        },
        _count: {
          _all: true,
        },
        _avg: {
          bestTimeSeconds: true,
        },
      }),
      this.prisma.levelProgress.findFirst({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
          userId: actor.userId,
          bestTimeSeconds: {
            not: null,
          },
        },
        orderBy: [
          {
            bestTimeSeconds: 'asc',
          },
          {
            levelNumber: 'asc',
          },
        ],
        select: {
          levelNumber: true,
          bestTimeSeconds: true,
        },
      }),
    ])

    const completedLevels = aggregate._count._all

    return {
      difficulty,
      completedLevels,
      fastestLevel:
        fastestRecord && fastestRecord.bestTimeSeconds !== null
          ? {
              levelNumber: fastestRecord.levelNumber,
              timeSeconds: fastestRecord.bestTimeSeconds,
            }
          : null,
      averageTimeSeconds:
        completedLevels > 0 && aggregate._avg.bestTimeSeconds !== null
          ? Math.round(aggregate._avg.bestTimeSeconds)
          : null,
    }
  }

  async getOverallStatisticsSummary(
    actorKey: string,
  ): Promise<OverallProgressStatisticsSummary> {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return {
        totalCompletedLevels: 0,
      }
    }

    // Time played is no longer derived here. It used to be `_sum(bestTimeSeconds)`, which fell
    // whenever a player improved a level; it is now a lifetime counter on
    // `player_statistics_totals`, added to by every completion.
    const totalCompletedLevels = await this.prisma.levelProgress.count({
      where: {
        userId: actor.userId,
        bestTimeSeconds: {
          not: null,
        },
      },
    })

    return {
      totalCompletedLevels,
    }
  }

  async listByDifficulty(actorKey: string, difficulty: AppDifficulty) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return []
    }

    const records = await this.prisma.levelProgress.findMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        userId: actor.userId,
      },
      orderBy: {
        levelNumber: 'asc',
      },
    })

    return records.map(toLevelProgressRecord)
  }

  async getByDifficultyAndNumber(actorKey: string, difficulty: AppDifficulty, levelNumber: number) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return null
    }

    const record = await this.prisma.levelProgress.findFirst({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        levelNumber,
        userId: actor.userId,
      },
    })

    return record ? toLevelProgressRecord(record) : null
  }

  async save(actorKey: string, progress: LevelProgressRecord) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return progress
    }

    // A write always stamps its own time. `progress.updatedAt` is the caller's idea of when it last
    // changed and can legitimately be null (nothing recorded yet), so it is not a value to persist.
    const writtenAt = new Date()

    const savedRecord = await this.prisma.levelProgress.upsert({
      where: {
        userId_difficulty_levelNumber: {
          userId: actor.userId,
          difficulty: toPrismaDifficulty(progress.difficulty),
          levelNumber: progress.levelNumber,
        },
      },
      update: {
        actorType: actor.actorType,
        userId: actor.userId,
        bestTimeSeconds: progress.bestTimeSeconds,
        completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
        updatedAt: writtenAt,
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        difficulty: toPrismaDifficulty(progress.difficulty),
        levelNumber: progress.levelNumber,
        bestTimeSeconds: progress.bestTimeSeconds,
        completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
        updatedAt: writtenAt,
      },
    })

    return toLevelProgressRecord(savedRecord)
  }
}
