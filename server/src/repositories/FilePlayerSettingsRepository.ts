import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  playerSettingsRecordSchema,
  type PlayerSettingsRecord,
} from '../types/settings'

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

export class FilePlayerSettingsRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getFilePath(actorKey: string) {
    return path.join(
      this.rootDirectory,
      'actors',
      this.toSafeActorDirectory(actorKey),
      'player-settings.json',
    )
  }

  private toSafeActorDirectory(actorKey: string) {
    return actorKey.replace(/[^a-zA-Z0-9_-]/g, '_')
  }

  async get(actorKey: string) {
    try {
      const rawFile = await readFile(this.getFilePath(actorKey), 'utf8')
      return playerSettingsRecordSchema.parse(JSON.parse(rawFile))
    } catch {
      return createDefaultSettingsRecord()
    }
  }

  async save(actorKey: string, record: PlayerSettingsRecord) {
    await mkdir(path.dirname(this.getFilePath(actorKey)), { recursive: true })
    await writeFile(this.getFilePath(actorKey), `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    return record
  }
}
