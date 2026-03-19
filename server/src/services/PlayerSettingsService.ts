import type { PlayerSettingsInput } from '../schemas/settingsSchemas'
import { FilePlayerSettingsRepository } from '../repositories/FilePlayerSettingsRepository'

export class PlayerSettingsService {
  private readonly playerSettingsRepository: FilePlayerSettingsRepository

  constructor(playerSettingsRepository: FilePlayerSettingsRepository) {
    this.playerSettingsRepository = playerSettingsRepository
  }

  async getSettings() {
    return this.playerSettingsRepository.get()
  }

  async saveSettings(settings: PlayerSettingsInput) {
    const nextRecord = {
      ...settings,
      updatedAt: new Date().toISOString(),
    }

    return this.playerSettingsRepository.save(nextRecord)
  }
}
