import type { PrismaClient } from '@prisma/client'

import type { PlayerStatisticsRecord } from '../types/statistics'
import type { PlayerStatisticsRepository } from './interfaces'
import { resolveActorReference } from './prismaActor'

function createEmptyStatisticsRecord(): PlayerStatisticsRecord {
  return {
    totalCompletedLevels: 0,
    totalBullPlacements: 0,
    totalCompletionTimeSeconds: 0,
    byDifficulty: [],
    updatedAt: '',
  }
}

function toPlayerStatisticsRecord(record: {
  totalCompletedLevels: number
  totalBullPlacements: number
  totalCompletionTimeSeconds: number
  updatedAt: Date
}): PlayerStatisticsRecord {
  return {
    totalCompletedLevels: record.totalCompletedLevels,
    totalBullPlacements: record.totalBullPlacements,
    totalCompletionTimeSeconds: record.totalCompletionTimeSeconds,
    byDifficulty: [],
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

  async save(actorKey: string, record: PlayerStatisticsRecord) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return record
    }

    const savedRecord = await this.prisma.playerStatisticsTotal.upsert({
      where: { userId: actor.userId },
      update: {
        actorType: actor.actorType,
        userId: actor.userId,
        totalCompletedLevels: record.totalCompletedLevels,
        totalBullPlacements: record.totalBullPlacements,
        totalCompletionTimeSeconds: record.totalCompletionTimeSeconds,
        updatedAt: new Date(record.updatedAt),
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        totalCompletedLevels: record.totalCompletedLevels,
        totalBullPlacements: record.totalBullPlacements,
        totalCompletionTimeSeconds: record.totalCompletionTimeSeconds,
        updatedAt: new Date(record.updatedAt),
      },
    })

    return toPlayerStatisticsRecord(savedRecord)
  }
}
