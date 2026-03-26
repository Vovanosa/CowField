import type { Request, Response } from 'express'

import { getAuthenticatedActor } from '../middleware/authMiddleware'
import { bullPlacementsInputSchema } from '../schemas/statisticsSchemas'
import { PlayerStatisticsService } from '../services/PlayerStatisticsService'

export class PlayerStatisticsController {
  private readonly playerStatisticsService: PlayerStatisticsService

  constructor(playerStatisticsService: PlayerStatisticsService) {
    this.playerStatisticsService = playerStatisticsService
  }

  getSummary = async (request: Request, response: Response) => {
    const actor = getAuthenticatedActor(request)
    const summary = await this.playerStatisticsService.getSummary(actor.actorKey)
    response.json(summary)
  }

  recordBullPlacements = async (request: Request, response: Response) => {
    const actor = getAuthenticatedActor(request)
    const input = bullPlacementsInputSchema.parse(request.body)
    const payload = await this.playerStatisticsService.recordBullPlacements(actor.actorKey, input.count)
    response.status(201).json(payload)
  }
}
