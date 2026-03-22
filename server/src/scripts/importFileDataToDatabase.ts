import 'dotenv/config'

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { getPrismaClient } from '../db/prismaClient'
import { getDatabaseUrl } from '../db/config'
import { enforceConfiguredAdminAccount, normalizeEmail } from '../auth/adminAccount'
import type {
  PasswordResetTokenRecord,
  SessionRecord,
  UserRecord,
} from '../types/auth'
import type { ContentRecord } from '../types/content'
import type { LevelRecord } from '../types/level'
import type { LevelProgressRecord } from '../types/progress'
import type { PlayerSettingsRecord } from '../types/settings'
import type { PlayerStatisticsRecord } from '../types/statistics'
import { resolveActorReference } from '../repositories/prismaActor'

type ImportSummary = {
  contentEntries: number
  guestProfiles: number
  levelProgressRecords: number
  levels: number
  passwordResetTokens: number
  playerSettingsRecords: number
  playerStatisticsRecords: number
  sessions: number
  users: number
}

const summary: ImportSummary = {
  contentEntries: 0,
  guestProfiles: 0,
  levelProgressRecords: 0,
  levels: 0,
  passwordResetTokens: 0,
  playerSettingsRecords: 0,
  playerStatisticsRecords: 0,
  sessions: 0,
  users: 0,
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const rawContent = await readFile(filePath, 'utf8')
  return JSON.parse(rawContent) as T
}

async function readOptionalJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return await readJsonFile<T>(filePath)
  } catch {
    return null
  }
}

function getRootDirectory() {
  return path.resolve(process.cwd())
}

function getActorDirectoryPath(actorDirectoryName: string) {
  return path.join(getRootDirectory(), 'progress_data', 'actors', actorDirectoryName)
}

function getActorKeyFromDirectoryName(actorDirectoryName: string) {
  if (actorDirectoryName.startsWith('guest_')) {
    return `guest:${actorDirectoryName.slice('guest_'.length)}`
  }

  return actorDirectoryName
}

async function importUsers() {
  const prisma = getPrismaClient()
  const filePath = path.join(getRootDirectory(), 'auth_data', 'users.json')
  const users = await readOptionalJsonFile<UserRecord[]>(filePath)

  if (!users?.length) {
    return
  }

  for (const user of users) {
    await prisma.user.upsert({
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

    summary.users += 1
  }
}

async function importPasswordResetTokens() {
  const prisma = getPrismaClient()
  const filePath = path.join(getRootDirectory(), 'auth_data', 'password-reset-tokens.json')
  const records = await readOptionalJsonFile<PasswordResetTokenRecord[]>(filePath)

  if (!records?.length) {
    return
  }

  for (const record of records) {
    await prisma.passwordResetToken.upsert({
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

    summary.passwordResetTokens += 1
  }
}

async function ensureGuestProfilesFromActorDirectories() {
  const prisma = getPrismaClient()
  const actorsRoot = path.join(getRootDirectory(), 'progress_data', 'actors')

  let actorDirectories: string[] = []

  try {
    const entries = await readdir(actorsRoot, { withFileTypes: true })
    actorDirectories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  } catch {
    return
  }

  for (const actorDirectoryName of actorDirectories) {
    const actorKey = getActorKeyFromDirectoryName(actorDirectoryName)

    if (!actorKey.startsWith('guest:')) {
      continue
    }

    await resolveActorReference(prisma, actorKey, {
      createGuestProfile: true,
    })

    summary.guestProfiles += 1
  }
}

async function importSessions() {
  const prisma = getPrismaClient()
  const filePath = path.join(getRootDirectory(), 'auth_data', 'auth-sessions.json')
  const sessions = await readOptionalJsonFile<SessionRecord[]>(filePath)

  if (!sessions?.length) {
    return
  }

  for (const session of sessions) {
    const actor = await resolveActorReference(prisma, session.actorKey, {
      createGuestProfile: session.role === 'guest',
    })
    const sessionRole =
      session.role === 'guest'
        ? 'guest'
        : (
            await prisma.user.findUnique({
              where: {
                id: actor.userId ?? undefined,
              },
              select: {
                role: true,
              },
            })
          )?.role ?? 'user'

    await prisma.session.upsert({
      where: {
        token: session.token,
      },
      update: {
        actorKey: session.actorKey,
        actorType: actor.actorType,
        role: sessionRole,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        email: session.email,
        displayName: session.displayName,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      },
      create: {
        token: session.token,
        actorKey: session.actorKey,
        actorType: actor.actorType,
        role: sessionRole,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        email: session.email,
        displayName: session.displayName,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      },
    })

    summary.sessions += 1
  }
}

async function normalizeImportedAdminAccount() {
  const prisma = getPrismaClient()
  const adminEmail = process.env.BULLPEN_ADMIN_EMAIL ?? 'vovanosa06@gmail.com'
  await enforceConfiguredAdminAccount(
    {
      listAll: async () => {
        const users = await prisma.user.findMany()
        return users.map((user) => ({
          id: user.id,
          email: normalizeEmail(user.email),
          passwordHash: user.passwordHash,
          googleId: user.googleId,
          role: user.role,
          displayName: user.displayName,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }))
      },
      getByEmail: async (email) => {
        const user = await prisma.user.findUnique({
          where: {
            email: normalizeEmail(email),
          },
        })

        return user
          ? {
              id: user.id,
              email: user.email,
              passwordHash: user.passwordHash,
              googleId: user.googleId,
              role: user.role,
              displayName: user.displayName,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            }
          : null
      },
      getById: async (id) => {
        const user = await prisma.user.findUnique({ where: { id } })
        return user
          ? {
              id: user.id,
              email: user.email,
              passwordHash: user.passwordHash,
              googleId: user.googleId,
              role: user.role,
              displayName: user.displayName,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            }
          : null
      },
      getByGoogleId: async (googleId) => {
        const user = await prisma.user.findUnique({ where: { googleId } })
        return user
          ? {
              id: user.id,
              email: user.email,
              passwordHash: user.passwordHash,
              googleId: user.googleId,
              role: user.role,
              displayName: user.displayName,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            }
          : null
      },
      save: async (user) => {
        const savedUser = await prisma.user.upsert({
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

        return {
          id: savedUser.id,
          email: savedUser.email,
          passwordHash: savedUser.passwordHash,
          googleId: savedUser.googleId,
          role: savedUser.role,
          displayName: savedUser.displayName,
          createdAt: savedUser.createdAt.toISOString(),
          updatedAt: savedUser.updatedAt.toISOString(),
        }
      },
    },
    adminEmail,
    'adminadmin',
  )
}

async function importActorData() {
  const prisma = getPrismaClient()
  const actorsRoot = path.join(getRootDirectory(), 'progress_data', 'actors')

  let actorDirectories: string[] = []

  try {
    const entries = await readdir(actorsRoot, { withFileTypes: true })
    actorDirectories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  } catch {
    return
  }

  for (const actorDirectoryName of actorDirectories) {
    const actorKey = getActorKeyFromDirectoryName(actorDirectoryName)
    const actor = await resolveActorReference(prisma, actorKey, {
      createGuestProfile: actorKey.startsWith('guest:'),
    })
    const actorDirectoryPath = getActorDirectoryPath(actorDirectoryName)

    const progressRecords =
      (await readOptionalJsonFile<LevelProgressRecord[]>(
        path.join(actorDirectoryPath, 'player-progress.json'),
      )) ?? []

    for (const record of progressRecords) {
      await prisma.levelProgress.upsert({
        where: actor.userId
          ? {
              userId_difficulty_levelNumber: {
                userId: actor.userId,
                difficulty: record.difficulty,
                levelNumber: record.levelNumber,
              },
            }
          : {
              guestProfileId_difficulty_levelNumber: {
                guestProfileId: actor.guestProfileId ?? '__missing__',
                difficulty: record.difficulty,
                levelNumber: record.levelNumber,
              },
            },
        update: {
          actorType: actor.actorType,
          userId: actor.userId,
          guestProfileId: actor.guestProfileId,
          bestTimeSeconds: record.bestTimeSeconds,
          completedAt: record.completedAt ? new Date(record.completedAt) : null,
          updatedAt: new Date(record.updatedAt),
        },
        create: {
          actorType: actor.actorType,
          userId: actor.userId,
          guestProfileId: actor.guestProfileId,
          difficulty: record.difficulty,
          levelNumber: record.levelNumber,
          bestTimeSeconds: record.bestTimeSeconds,
          completedAt: record.completedAt ? new Date(record.completedAt) : null,
          updatedAt: new Date(record.updatedAt),
        },
      })

      summary.levelProgressRecords += 1
    }

    const settingsRecord = await readOptionalJsonFile<PlayerSettingsRecord>(
      path.join(actorDirectoryPath, 'player-settings.json'),
    )

    if (settingsRecord) {
      await prisma.playerSettings.upsert({
        where: actor.userId
          ? { userId: actor.userId }
          : { guestProfileId: actor.guestProfileId ?? '__missing__' },
        update: {
          actorType: actor.actorType,
          userId: actor.userId,
          guestProfileId: actor.guestProfileId,
          language: settingsRecord.language,
          soundEffectsEnabled: settingsRecord.soundEffectsEnabled,
          soundEffectsVolume: settingsRecord.soundEffectsVolume,
          musicEnabled: settingsRecord.musicEnabled,
          musicVolume: settingsRecord.musicVolume,
          darkModeEnabled: settingsRecord.darkModeEnabled,
          takeYourTimeEnabled: settingsRecord.takeYourTimeEnabled,
          autoPlaceDotsEnabled: settingsRecord.autoPlaceDotsEnabled,
          updatedAt: new Date(settingsRecord.updatedAt),
        },
        create: {
          actorType: actor.actorType,
          userId: actor.userId,
          guestProfileId: actor.guestProfileId,
          language: settingsRecord.language,
          soundEffectsEnabled: settingsRecord.soundEffectsEnabled,
          soundEffectsVolume: settingsRecord.soundEffectsVolume,
          musicEnabled: settingsRecord.musicEnabled,
          musicVolume: settingsRecord.musicVolume,
          darkModeEnabled: settingsRecord.darkModeEnabled,
          takeYourTimeEnabled: settingsRecord.takeYourTimeEnabled,
          autoPlaceDotsEnabled: settingsRecord.autoPlaceDotsEnabled,
          updatedAt: new Date(settingsRecord.updatedAt),
        },
      })

      summary.playerSettingsRecords += 1
    }

    const statisticsRecord = await readOptionalJsonFile<PlayerStatisticsRecord>(
      path.join(actorDirectoryPath, 'player-statistics.json'),
    )

    if (statisticsRecord) {
      await prisma.playerStatisticsTotal.upsert({
        where: actor.userId
          ? { userId: actor.userId }
          : { guestProfileId: actor.guestProfileId ?? '__missing__' },
        update: {
          actorType: actor.actorType,
          userId: actor.userId,
          guestProfileId: actor.guestProfileId,
          totalBullPlacements: statisticsRecord.totalBullPlacements,
          updatedAt: new Date(statisticsRecord.updatedAt),
        },
        create: {
          actorType: actor.actorType,
          userId: actor.userId,
          guestProfileId: actor.guestProfileId,
          totalCompletedLevels: 0,
          totalBullPlacements: statisticsRecord.totalBullPlacements,
          totalCompletionTimeSeconds: 0,
          updatedAt: new Date(statisticsRecord.updatedAt),
        },
      })

      summary.playerStatisticsRecords += 1
    }
  }
}

async function importLevels() {
  const prisma = getPrismaClient()
  const levelsRoot = path.join(getRootDirectory(), 'levels_data')
  const difficultyDirectories = ['light', 'easy', 'medium', 'hard'] as const

  for (const difficulty of difficultyDirectories) {
    const difficultyPath = path.join(levelsRoot, difficulty)

    let entries: string[] = []

    try {
      const directoryEntries = await readdir(difficultyPath, { withFileTypes: true })
      entries = directoryEntries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name)
    } catch {
      continue
    }

    for (const fileName of entries) {
      const level = await readJsonFile<LevelRecord>(path.join(difficultyPath, fileName))

      await prisma.level.upsert({
        where: {
          difficulty_levelNumber: {
            difficulty: level.difficulty,
            levelNumber: level.levelNumber,
          },
        },
        update: {
          title: level.title,
          gridSize: level.gridSize,
          pensByCell: level.colorsByCell,
          cowsByCell: level.cowsByCell,
          createdAt: new Date(level.createdAt),
          updatedAt: new Date(level.updatedAt),
        },
        create: {
          difficulty: level.difficulty,
          levelNumber: level.levelNumber,
          title: level.title,
          gridSize: level.gridSize,
          pensByCell: level.colorsByCell,
          cowsByCell: level.cowsByCell,
          createdAt: new Date(level.createdAt),
          updatedAt: new Date(level.updatedAt),
        },
      })

      summary.levels += 1
    }
  }
}

async function importContent() {
  const prisma = getPrismaClient()
  const contentRoot = path.join(getRootDirectory(), 'content_data')

  let entries: string[] = []

  try {
    const directoryEntries = await readdir(contentRoot, { withFileTypes: true })
    entries = directoryEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
  } catch {
    return
  }

  for (const fileName of entries) {
    const content = await readJsonFile<ContentRecord>(path.join(contentRoot, fileName))

    await prisma.contentEntry.upsert({
      where: {
        key: content.key,
      },
      update: {
        text: content.text,
        updatedAt: content.updatedAt ? new Date(content.updatedAt) : new Date(),
      },
      create: {
        key: content.key,
        text: content.text,
        updatedAt: content.updatedAt ? new Date(content.updatedAt) : new Date(),
      },
    })

    summary.contentEntries += 1
  }
}

async function main() {
  const databaseUrl = getDatabaseUrl()

  console.log(`Importing file-backed data into database: ${databaseUrl}`)

  await importUsers()
  await normalizeImportedAdminAccount()
  await ensureGuestProfilesFromActorDirectories()
  await importSessions()
  await importPasswordResetTokens()
  await importActorData()
  await importLevels()
  await importContent()

  console.log('Import complete.')
  console.table(summary)
}

void main()
  .catch((error: unknown) => {
    console.error('Database import failed.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await getPrismaClient().$disconnect()
  })
