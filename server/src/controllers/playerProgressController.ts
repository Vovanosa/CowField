import type { Request, Response } from 'express'

import {
  completeLevelInputSchema,
  importProgressInputSchema,
  progressDifficultyParamsSchema,
  progressParamsSchema,
} from '../schemas/progressSchemas'
import { getAuthenticatedActor } from '../middleware/authMiddleware'
import { PlayerProgressService } from '../services/PlayerProgressService'

export class PlayerProgressController {
  private readonly playerProgressService: PlayerProgressService

  constructor(playerProgressService: PlayerProgressService) {
    this.playerProgressService = playerProgressService
  }

  listByDifficulty = async (request: Request, response: Response) => {
    const params = progressDifficultyParamsSchema.parse(request.params)
    const actor = getAuthenticatedActor(request)
    const bestTimes = await this.playerProgressService.getBestTimesByDifficulty(
      actor.actorKey,
      params.difficulty,
    )

    response.json({
      difficulty: params.difficulty,
      bestTimes,
    })
  }

  getOverview = async (request: Request, response: Response) => {
    const actor = getAuthenticatedActor(request)
    const overview = await this.playerProgressService.getOverview(actor.actorKey)

    response.json(overview)
  }

  completeLevel = async (request: Request, response: Response) => {
    const params = progressParamsSchema.parse(request.params)
    const body = completeLevelInputSchema.parse(request.body)
    const actor = getAuthenticatedActor(request)
    const payload = await this.playerProgressService.completeLevel(
      actor.actorKey,
      params.difficulty,
      params.levelNumber,
      body,
    )

    response.status(201).json(payload)
  }

  /**
   * The guest-to-account handover (P18, decision D5). One request for the whole record — see
   * `PlayerProgressService.importGuestProgress` for why it may only ever write to the caller.
   */
  importProgress = async (request: Request, response: Response) => {
    const body = importProgressInputSchema.parse(request.body)
    const actor = getAuthenticatedActor(request)
    const payload = await this.playerProgressService.importGuestProgress(actor.actorKey, body.entries)

    response.status(201).json(payload)
  }
}
