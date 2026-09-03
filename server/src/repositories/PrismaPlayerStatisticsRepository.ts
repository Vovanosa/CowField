import type { PrismaClient } from '@prisma/client'

import type { PlayerStatisticsRecord } from '../types/statistics'
import type { PlayerStatisticsRepository } from './interfaces'
import { resolveActorReference } from './prismaActor'

function createEmptyStatisticsRecord(): PlayerStatisticsRecord {
  return {
    totalBullPlacements: 0,
    totalCompletionTimeSeconds: 0,
    updatedAt: null,
  }
}

function toPlayerStatisticsRecord(record: {
  totalBullPlacements: number
  totalCompletionTimeSeconds: number
  updatedAt: Date
}): PlayerStatisticsRecord {
  return {
    totalBullPlacements: record.totalBullPlacements,
    totalCompletionTimeSeconds: record.totalCompletionTimeSeconds,
    updatedAt: record.updatedAt.toISOString(),
  }
}

export class PrismaPlayerStatisticsRepository implements PlayerStatisticsRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async get(actorKey: string) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return createEmptyStatisticsRecord()
    }

    const record = await this.prisma.playerStatisticsTotal.findFirst({
      where: { userId: actor.userId },
    })

    return record ? toPlayerStatisticsRecord(record) : createEmptyStatisticsRecord()
  }

  /**
   * Adds to the lifetime counter in a single statement.
   *
   * Deliberately not read-modify-write: two completions landing at once would each read the same
   * starting value and one increment would be lost.
   */
  async incrementBullPlacements(actorKey: string, count: number) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return 0
    }

    const record = await this.prisma.playerStatisticsTotal.upsert({
      where: { userId: actor.userId },
      update: {
        totalBullPlacements: {
          increment: count,
        },
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        totalBullPlacements: count,
      },
      select: {
        totalBullPlacements: true,
      },
    })

    return record.totalBullPlacements
  }

  /**
   * Adds one completion's time to the player's lifetime total, in a single statement.
   *
   * This is **time actually played**, so it counts every completion — including replaying a level
   * you have already finished — and it never goes down. It used to be reported as
   * `SUM(best_time_seconds)` across the progress table, which meant the figure *fell* whenever a
   * player improved a level.
   */
  async addCompletionTimeSeconds(actorKey: string, seconds: number) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId || seconds <= 0) {
      return 0
    }

    const record = await this.prisma.playerStatisticsTotal.upsert({
      where: { userId: actor.userId },
      update: {
        totalCompletionTimeSeconds: {
          increment: seconds,
        },
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        totalCompletionTimeSeconds: seconds,
      },
      select: {
        totalCompletionTimeSeconds: true,
      },
    })

    return record.totalCompletionTimeSeconds
  }
}
