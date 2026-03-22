import { Difficulty, type PrismaClient } from '@prisma/client'

import type { Difficulty as AppDifficulty } from '../types/level'
import type { LevelProgressRecord } from '../types/progress'
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

function sortProgress(left: LevelProgressRecord, right: LevelProgressRecord) {
  if (left.difficulty === right.difficulty) {
    return left.levelNumber - right.levelNumber
  }

  return left.difficulty.localeCompare(right.difficulty)
}

export class PrismaPlayerProgressRepository implements PlayerProgressRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async listByDifficulty(actorKey: string, difficulty: AppDifficulty) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    const records = await this.prisma.levelProgress.findMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        ...(actor.userId
          ? { userId: actor.userId }
          : actor.guestProfileId
            ? { guestProfileId: actor.guestProfileId }
            : { id: '__missing__' }),
      },
      orderBy: {
        levelNumber: 'asc',
      },
    })

    return records.map(toLevelProgressRecord)
  }

  async listAll(actorKey: string) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    const records = await this.prisma.levelProgress.findMany({
      where: actor.userId
        ? { userId: actor.userId }
        : actor.guestProfileId
          ? { guestProfileId: actor.guestProfileId }
          : { id: '__missing__' },
    })

    return records.map(toLevelProgressRecord).sort(sortProgress)
  }

  async getByDifficultyAndNumber(actorKey: string, difficulty: AppDifficulty, levelNumber: number) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    const record = await this.prisma.levelProgress.findFirst({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        levelNumber,
        ...(actor.userId
          ? { userId: actor.userId }
          : actor.guestProfileId
            ? { guestProfileId: actor.guestProfileId }
            : { id: '__missing__' }),
      },
    })

    return record ? toLevelProgressRecord(record) : null
  }

  async save(actorKey: string, progress: LevelProgressRecord) {
    const actor = await resolveActorReference(this.prisma, actorKey, {
      createGuestProfile: true,
    })

    const savedRecord = await this.prisma.levelProgress.upsert({
      where: actor.userId
        ? {
            userId_difficulty_levelNumber: {
              userId: actor.userId,
              difficulty: toPrismaDifficulty(progress.difficulty),
              levelNumber: progress.levelNumber,
            },
          }
        : {
            guestProfileId_difficulty_levelNumber: {
              guestProfileId: actor.guestProfileId ?? '__missing__',
              difficulty: toPrismaDifficulty(progress.difficulty),
              levelNumber: progress.levelNumber,
            },
          },
      update: {
        actorType: actor.actorType,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        bestTimeSeconds: progress.bestTimeSeconds,
        completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
        updatedAt: new Date(progress.updatedAt),
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        difficulty: toPrismaDifficulty(progress.difficulty),
        levelNumber: progress.levelNumber,
        bestTimeSeconds: progress.bestTimeSeconds,
        completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
        updatedAt: new Date(progress.updatedAt),
      },
    })

    return toLevelProgressRecord(savedRecord)
  }
}
