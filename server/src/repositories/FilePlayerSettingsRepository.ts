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

  private getFilePath() {
    return path.join(this.rootDirectory, 'player-settings.json')
  }

  async get() {
    try {
      const rawFile = await readFile(this.getFilePath(), 'utf8')
      return playerSettingsRecordSchema.parse(JSON.parse(rawFile))
    } catch {
      return createDefaultSettingsRecord()
    }
  }

  async save(record: PlayerSettingsRecord) {
    await mkdir(this.rootDirectory, { recursive: true })
    await writeFile(this.getFilePath(), `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    return record
  }
}
