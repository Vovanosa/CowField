import { AccountRole, type PrismaClient } from '@prisma/client'

import type { UserRecord } from '../types/auth'
import type { UserRepository } from './interfaces'

function toUserRecord(user: {
  id: string
  email: string
  passwordHash: string | null
  googleId: string | null
  role: AccountRole
  displayName: string
  createdAt: Date
  updatedAt: Date
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    googleId: user.googleId,
    role: user.role,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export class PrismaUserRepository implements UserRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async listAll() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        email: 'asc',
      },
    })

    return users.map(toUserRecord)
  }

  async getByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    })

    return user ? toUserRecord(user) : null
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })

    return user ? toUserRecord(user) : null
  }

  async getByGoogleId(googleId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        googleId,
      },
    })

    return user ? toUserRecord(user) : null
  }

  async save(user: UserRecord) {
    const savedUser = await this.prisma.user.upsert({
      where: {
        id: user.id,
      },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        googleId: user.googleId,
        role: user.role,
        displayName: user.displayName,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        googleId: user.googleId,
        role: user.role,
        displayName: user.displayName,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    })

    return toUserRecord(savedUser)
  }
}
