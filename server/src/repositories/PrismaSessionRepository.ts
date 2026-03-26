import { ActorType, SessionRole, type PrismaClient } from '@prisma/client'

import type { SessionRecord } from '../types/auth'
import type { SessionRepository } from './interfaces'

function toSessionRecord(session: {
  token: string
  actorKey: string
  role: SessionRole
  userId: string | null
  email: string | null
  displayName: string
  createdAt: Date
  updatedAt: Date
}): SessionRecord {
  return {
    token: session.token,
    actorKey: session.actorKey,
    role: session.role,
    accountUserId: session.userId,
    email: session.email,
    displayName: session.displayName,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  }
}

export class PrismaSessionRepository implements SessionRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async getByToken(token: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        token,
      },
    })

    return session ? toSessionRecord(session) : null
  }

  async save(session: SessionRecord) {
    const actorType = session.role === 'guest' ? ActorType.guest : ActorType.user

    const savedSession = await this.prisma.session.upsert({
      where: {
        token: session.token,
      },
      update: {
        actorKey: session.actorKey,
        actorType,
        role: session.role,
        userId: actorType === ActorType.user ? session.accountUserId : null,
        email: session.email,
        displayName: session.displayName,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      },
      create: {
        token: session.token,
        actorKey: session.actorKey,
        actorType,
        role: session.role,
        userId: actorType === ActorType.user ? session.accountUserId : null,
        email: session.email,
        displayName: session.displayName,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      },
    })

    return toSessionRecord(savedSession)
  }

  async deleteByToken(token: string) {
    await this.prisma.session.deleteMany({
      where: {
        token,
      },
    })
  }

  async deleteByAccountUserId(accountUserId: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId: accountUserId,
      },
    })
  }
}
