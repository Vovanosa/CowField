import type { Request, Response } from 'express'

import { getAuthenticatedActor } from '../middleware/authMiddleware'
import { playerSettingsInputSchema } from '../schemas/settingsSchemas'
import { PlayerSettingsService } from '../services/PlayerSettingsService'

export class PlayerSettingsController {
  private readonly playerSettingsService: PlayerSettingsService

  constructor(playerSettingsService: PlayerSettingsService) {
    this.playerSettingsService = playerSettingsService
  }

  getSettings = async (request: Request, response: Response) => {
    const actor = getAuthenticatedActor(request)
    const settings = await this.playerSettingsService.getSettings(actor.actorKey, actor.role)
    response.json(settings)
  }

  saveSettings = async (request: Request, response: Response) => {
    const actor = getAuthenticatedActor(request)
    const payload = playerSettingsInputSchema.parse(request.body)
    const settings = await this.playerSettingsService.saveSettings(actor.actorKey, actor.role, payload)
    response.status(200).json(settings)
  }
}
