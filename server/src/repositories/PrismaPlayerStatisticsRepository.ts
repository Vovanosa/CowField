import type { PrismaClient } from '@prisma/client'

import type { PlayerStatisticsRecord } from '../types/statistics'
import type { PlayerStatisticsRepository } from './interfaces'
import { resolveActorReference } from './prismaActor'

function createEmptyStatisticsRecord(): PlayerStatisticsRecord {
  return {
    totalBullPlacements: 0,
    updatedAt: '',
  }
}

function toPlayerStatisticsRecord(record: {
  totalBullPlacements: number
  updatedAt: Date
}): PlayerStatisticsRecord {
  return {
    totalBullPlacements: record.totalBullPlacements,
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

    const record = await this.prisma.playerStatisticsTotal.findFirst({
      where: actor.userId
        ? { userId: actor.userId }
        : actor.guestProfileId
          ? { guestProfileId: actor.guestProfileId }
          : { id: '__missing__' },
    })

    return record ? toPlayerStatisticsRecord(record) : createEmptyStatisticsRecord()
  }

  async save(actorKey: string, record: PlayerStatisticsRecord) {
    const actor = await resolveActorReference(this.prisma, actorKey, {
      createGuestProfile: true,
    })

    const savedRecord = await this.prisma.playerStatisticsTotal.upsert({
      where: actor.userId
        ? { userId: actor.userId }
        : { guestProfileId: actor.guestProfileId ?? '__missing__' },
      update: {
        actorType: actor.actorType,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        totalBullPlacements: record.totalBullPlacements,
        updatedAt: new Date(record.updatedAt),
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        totalCompletedLevels: 0,
        totalBullPlacements: record.totalBullPlacements,
        totalCompletionTimeSeconds: 0,
        updatedAt: new Date(record.updatedAt),
      },
    })

    return toPlayerStatisticsRecord(savedRecord)
  }
}
