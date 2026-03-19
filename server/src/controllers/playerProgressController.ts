import type { Request, Response } from 'express'

import {
  completeLevelInputSchema,
  progressDifficultyParamsSchema,
  progressParamsSchema,
} from '../schemas/progressSchemas'
import { PlayerProgressService } from '../services/PlayerProgressService'

export class PlayerProgressController {
  private readonly playerProgressService: PlayerProgressService

  constructor(playerProgressService: PlayerProgressService) {
    this.playerProgressService = playerProgressService
  }

  listByDifficulty = async (request: Request, response: Response) => {
    const params = progressDifficultyParamsSchema.parse(request.params)
    const levels = await this.playerProgressService.listByDifficulty(params.difficulty)

    response.json({
      difficulty: params.difficulty,
      levels,
    })
  }

  getByDifficultyAndNumber = async (request: Request, response: Response) => {
    const params = progressParamsSchema.parse(request.params)
    const progress = await this.playerProgressService.getByDifficultyAndNumber(
      params.difficulty,
      params.levelNumber,
    )

    response.json(progress)
  }

  completeLevel = async (request: Request, response: Response) => {
    const params = progressParamsSchema.parse(request.params)
    const body = completeLevelInputSchema.parse(request.body)
    const payload = await this.playerProgressService.completeLevel(
      params.difficulty,
      params.levelNumber,
      body,
    )

    response.status(201).json(payload)
  }
}
