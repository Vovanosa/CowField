import type { Request, Response } from 'express'

import { PlayerStatisticsService } from '../services/PlayerStatisticsService'

export class PlayerStatisticsController {
  private readonly playerStatisticsService: PlayerStatisticsService

  constructor(playerStatisticsService: PlayerStatisticsService) {
    this.playerStatisticsService = playerStatisticsService
  }

  getSummary = async (_request: Request, response: Response) => {
    const summary = await this.playerStatisticsService.getSummary()
    response.json(summary)
  }

  recordBullPlacement = async (_request: Request, response: Response) => {
    const payload = await this.playerStatisticsService.recordBullPlacement()
    response.status(201).json(payload)
  }
}
