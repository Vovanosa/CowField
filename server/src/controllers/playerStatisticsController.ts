import type { Request, Response } from 'express'

import { getAuthenticatedActor } from '../middleware/authMiddleware'
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

  recordBullPlacement = async (request: Request, response: Response) => {
    const actor = getAuthenticatedActor(request)
    const payload = await this.playerStatisticsService.recordBullPlacement(actor.actorKey)
    response.status(201).json(payload)
  }
}
