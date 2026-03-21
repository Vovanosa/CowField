import type { PlayerSettingsInput } from '../schemas/settingsSchemas'
import { FilePlayerSettingsRepository } from '../repositories/FilePlayerSettingsRepository'
import type { SessionRole } from '../types/auth'

export class PlayerSettingsService {
  private readonly playerSettingsRepository: FilePlayerSettingsRepository

  constructor(playerSettingsRepository: FilePlayerSettingsRepository) {
    this.playerSettingsRepository = playerSettingsRepository
  }

  private applyRoleRules(settings: PlayerSettingsInput, role: SessionRole) {
    if (role !== 'guest') {
      return settings
    }

    return {
      ...settings,
      takeYourTimeEnabled: true,
    }
  }

  async getSettings(actorKey: string, role: SessionRole) {
    const settings = await this.playerSettingsRepository.get(actorKey)
    return this.applyRoleRules(settings, role)
  }

  async saveSettings(actorKey: string, role: SessionRole, settings: PlayerSettingsInput) {
    const nextSettings = this.applyRoleRules(settings, role)
    const nextRecord = {
      ...nextSettings,
      updatedAt: new Date().toISOString(),
    }

    return this.playerSettingsRepository.save(actorKey, nextRecord)
  }
}
