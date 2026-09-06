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

  // No `?page`/`?limit`. Nothing ever sent them: the client fetched the whole catalogue and then
  // re-sliced it locally, and the levels page pages its grid from what it already holds.
  listByDifficulty = async (request: Request, response: Response) => {
    const params = difficultyParamsSchema.parse(request.params)
    const levels = await this.levelService.listByDifficulty(params.difficulty)

    // The catalogue changes only when an admin adds, renames or deletes a level, so a browser may
    // reuse it across reloads — but it must revalidate, because that admin edit has to show up
    // promptly for everyone. Express's ETag turns the revalidation into a 304 with no body.
    response.setHeader('Cache-Control', 'private, no-cache')
    response.json(levels)
  }

  getOverview = async (_request: Request, response: Response) => {
    const overview = await this.levelService.getOverview()

    response.json(overview)
  }

  getDifficultySummary = async (request: Request, response: Response) => {
    const params = difficultyParamsSchema.parse(request.params)
    const summary = await this.levelService.getDifficultySummary(params.difficulty)

    response.json(summary)
  }

  getByDifficultyAndNumber = async (request: Request, response: Response) => {
    const params = levelParamsSchema.parse(request.params)
    const actor = getAuthenticatedActor(request)
    const isAdmin = actor.role === 'admin'
    const level = await this.levelService.getByDifficultyAndNumber(
      params.difficulty,
      params.levelNumber,
      isAdmin,
    )

    // A board cannot change under a player: only an admin rewrites one. `private` because the
    // response is per-role — an admin's copy carries `cowsByCell` — so it must never sit in a shared
    // cache. Admins get `no-store` instead: they are the ones editing, and a stale board in the
    // editor would be a data-loss bug rather than a slow reload.
    response.setHeader('Cache-Control', isAdmin ? 'no-store' : 'private, max-age=600')
    response.json(level)
  }

  save = async (request: Request, response: Response) => {
    const params = levelParamsSchema.parse(request.params)
    const body = levelRecordInputSchema.parse({
      ...request.body,
      difficulty: params.difficulty,
      levelNumber: params.levelNumber,
    })
    const actor = getAuthenticatedActor(request)
    const level = await this.levelService.save(body, actor.actorKey)

    response.status(201).json(level)
  }

  delete = async (request: Request, response: Response) => {
    const params = levelParamsSchema.parse(request.params)
    const payload = await this.levelService.delete(params.difficulty, params.levelNumber)

    response.json(payload)
  }
}
