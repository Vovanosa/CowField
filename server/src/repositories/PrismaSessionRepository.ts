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
  expiresAt: Date
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
    expiresAt: session.expiresAt.toISOString(),
  }
}

export class PrismaSessionRepository implements SessionRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * The session for a token, or `null` if there is none **or it has expired**.
   *
   * An expired row is deleted on the way through rather than left for the prune script. That makes
   * this the ordinary cleanup path — a row costs one delete at the end of its life, on the single
   * request that first notices it — and it means an expired token can never authenticate even if
   * the prune has not run in months.
   *
   * Note what this no longer does: **write on a successful lookup.** It used to re-`save` the row
   * with a fresh `updatedAt` on every authenticated request — one database write per API call, for
   * a value no code ever read.
   */
  async getByToken(token: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        token,
      },
    })

    if (!session) {
      return null
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.deleteByToken(token)
      return null
    }

    return toSessionRecord(session)
  }

  /**
   * Deletes every session that is already past its expiry. Returns how many went.
   *
   * `getByToken` handles a session's own row when someone next presents that token, but a token
   * nobody ever uses again leaves its row behind forever — which is most of them. This is the bulk
   * sweep, run from `npm run sessions:prune`.
   */
  async deleteExpired(now: Date = new Date()) {
    const { count } = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    })

    return count
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
        expiresAt: new Date(session.expiresAt),
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
        expiresAt: new Date(session.expiresAt),
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
