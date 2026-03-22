import type { PrismaClient } from '@prisma/client'

import { type PlayerSettingsRecord } from '../types/settings'
import type { PlayerSettingsRepository } from './interfaces'
import { resolveActorReference } from './prismaActor'

function createDefaultSettingsRecord(): PlayerSettingsRecord {
  return {
    language: 'en',
    soundEffectsEnabled: false,
    soundEffectsVolume: 50,
    musicEnabled: false,
    musicVolume: 50,
    darkModeEnabled: false,
    takeYourTimeEnabled: false,
    autoPlaceDotsEnabled: false,
    updatedAt: '',
  }
}

function toPlayerSettingsRecord(settings: {
  language: string
  soundEffectsEnabled: boolean
  soundEffectsVolume: number
  musicEnabled: boolean
  musicVolume: number
  darkModeEnabled: boolean
  takeYourTimeEnabled: boolean
  autoPlaceDotsEnabled: boolean
  updatedAt: Date
}): PlayerSettingsRecord {
  return {
    language: settings.language as PlayerSettingsRecord['language'],
    soundEffectsEnabled: settings.soundEffectsEnabled,
    soundEffectsVolume: settings.soundEffectsVolume,
    musicEnabled: settings.musicEnabled,
    musicVolume: settings.musicVolume,
    darkModeEnabled: settings.darkModeEnabled,
    takeYourTimeEnabled: settings.takeYourTimeEnabled,
    autoPlaceDotsEnabled: settings.autoPlaceDotsEnabled,
    updatedAt: settings.updatedAt.toISOString(),
  }
}

export class PrismaPlayerSettingsRepository implements PlayerSettingsRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async get(actorKey: string) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    const settings = await this.prisma.playerSettings.findFirst({
      where: actor.userId
        ? { userId: actor.userId }
        : actor.guestProfileId
          ? { guestProfileId: actor.guestProfileId }
          : { id: '__missing__' },
    })

    return settings ? toPlayerSettingsRecord(settings) : createDefaultSettingsRecord()
  }

  async save(actorKey: string, record: PlayerSettingsRecord) {
    const actor = await resolveActorReference(this.prisma, actorKey, {
      createGuestProfile: true,
    })

    const savedRecord = await this.prisma.playerSettings.upsert({
      where: actor.userId
        ? { userId: actor.userId }
        : { guestProfileId: actor.guestProfileId ?? '__missing__' },
      update: {
        actorType: actor.actorType,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        language: record.language,
        soundEffectsEnabled: record.soundEffectsEnabled,
        soundEffectsVolume: record.soundEffectsVolume,
        musicEnabled: record.musicEnabled,
        musicVolume: record.musicVolume,
        darkModeEnabled: record.darkModeEnabled,
        takeYourTimeEnabled: record.takeYourTimeEnabled,
        autoPlaceDotsEnabled: record.autoPlaceDotsEnabled,
        updatedAt: new Date(record.updatedAt),
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        guestProfileId: actor.guestProfileId,
        language: record.language,
        soundEffectsEnabled: record.soundEffectsEnabled,
        soundEffectsVolume: record.soundEffectsVolume,
        musicEnabled: record.musicEnabled,
        musicVolume: record.musicVolume,
        darkModeEnabled: record.darkModeEnabled,
        takeYourTimeEnabled: record.takeYourTimeEnabled,
        autoPlaceDotsEnabled: record.autoPlaceDotsEnabled,
        updatedAt: new Date(record.updatedAt),
      },
    })

    return toPlayerSettingsRecord(savedRecord)
  }
}
