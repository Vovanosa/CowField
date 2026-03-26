import type { Request, Response } from 'express'

import {
  difficultyParamsSchema,
  levelParamsSchema,
  levelRecordInputSchema,
} from '../schemas/levelSchemas'
import { getAuthenticatedActor } from '../middleware/authMiddleware'
import { LevelService } from '../services/LevelService'

export class LevelController {
  private readonly levelService: LevelService

  constructor(levelService: LevelService) {
    this.levelService = levelService
  }

  listByDifficulty = async (request: Request, response: Response) => {
    const params = difficultyParamsSchema.parse(request.params)
    const levels = await this.levelService.listByDifficulty(params.difficulty)

    response.json({
      difficulty: params.difficulty,
      levels,
    })
  }

  getByDifficultyAndNumber = async (request: Request, response: Response) => {
    const params = levelParamsSchema.parse(request.params)
    const actor = getAuthenticatedActor(request)
    const level = await this.levelService.getByDifficultyAndNumber(
      params.difficulty,
      params.levelNumber,
      actor.role === 'admin',
    )

    response.json(level)
  }

  save = async (request: Request, response: Response) => {
    const params = levelParamsSchema.parse(request.params)
    const body = levelRecordInputSchema.parse({
      ...request.body,
      difficulty: params.difficulty,
      levelNumber: params.levelNumber,
    })
    const level = await this.levelService.save(body)

    response.status(201).json(level)
  }

  delete = async (request: Request, response: Response) => {
    const params = levelParamsSchema.parse(request.params)
    const payload = await this.levelService.delete(params.difficulty, params.levelNumber)

    response.json(payload)
  }
}
