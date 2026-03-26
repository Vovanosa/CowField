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

  async listAll(actorKey: string) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return []
    }

    const records = await this.prisma.levelProgress.findMany({
      where: { userId: actor.userId },
    })

    return records.map(toLevelProgressRecord).sort(sortProgress)
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
        updatedAt: new Date(progress.updatedAt),
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
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
