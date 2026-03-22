import type { PrismaClient } from '@prisma/client'

import type { PasswordResetTokenRecord } from '../types/auth'
import type { PasswordResetTokenRepository } from './interfaces'

function toPasswordResetTokenRecord(record: {
  id: string
  userId: string
  email: string
  token: string
  createdAt: Date
  expiresAt: Date
}): PasswordResetTokenRecord {
  return {
    id: record.id,
    userId: record.userId,
    email: record.email,
    token: record.token,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
  }
}

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async save(record: PasswordResetTokenRecord) {
    const savedRecord = await this.prisma.passwordResetToken.upsert({
      where: {
        id: record.id,
      },
      update: {
        userId: record.userId,
        email: record.email,
        token: record.token,
        createdAt: new Date(record.createdAt),
        expiresAt: new Date(record.expiresAt),
      },
      create: {
        id: record.id,
        userId: record.userId,
        email: record.email,
        token: record.token,
        createdAt: new Date(record.createdAt),
        expiresAt: new Date(record.expiresAt),
      },
    })

    return toPasswordResetTokenRecord(savedRecord)
  }

  async getByToken(token: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: {
        token,
      },
    })

    return record ? toPasswordResetTokenRecord(record) : null
  }

  async deleteById(id: string) {
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        id,
      },
    })
  }
}
