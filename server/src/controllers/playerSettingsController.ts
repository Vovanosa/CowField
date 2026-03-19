import type { Request, Response } from 'express'

import { playerSettingsInputSchema } from '../schemas/settingsSchemas'
import { PlayerSettingsService } from '../services/PlayerSettingsService'

export class PlayerSettingsController {
  private readonly playerSettingsService: PlayerSettingsService

  constructor(playerSettingsService: PlayerSettingsService) {
    this.playerSettingsService = playerSettingsService
  }

  getSettings = async (_request: Request, response: Response) => {
    const settings = await this.playerSettingsService.getSettings()
    response.json(settings)
  }

  saveSettings = async (request: Request, response: Response) => {
    const payload = playerSettingsInputSchema.parse(request.body)
    const settings = await this.playerSettingsService.saveSettings(payload)
    response.status(200).json(settings)
  }
}
