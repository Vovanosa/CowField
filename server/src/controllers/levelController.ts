import type { Request, Response } from 'express'

import {
  difficultyParamsSchema,
  levelParamsSchema,
  levelRecordInputSchema,
} from '../schemas/levelSchemas'
import { getAuthenticatedActor, getOptionalActor } from '../middleware/authMiddleware'
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
    //
    // `public` for an anonymous caller (P18): the body is a list of level numbers with nothing in it
    // that belongs to anyone, so a shared cache may hold one copy for every reader. It stays
    // `private` when a session is attached, because `private` is about who the response was *made*
    // for, and proving "identical for everyone" is not worth the class of bug that gets this wrong.
    response.vary('Authorization')
    response.setHeader(
      'Cache-Control',
      getOptionalActor(request) ? 'private, no-cache' : 'public, no-cache',
    )
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
    // **Optional, since P18.** This was `getAuthenticatedActor`, which threw 401 when no bearer was
    // present and is the single line that made every level link private. No actor now means
    // `isAdmin: false`, which is the same answer a guest or a signed-in player already got.
    const actor = getOptionalActor(request)
    const isAdmin = actor?.role === 'admin'
    const level = await this.levelService.getByDifficultyAndNumber(
      params.difficulty,
      params.levelNumber,
      isAdmin,
    )

    // A board cannot change under a player: only an admin rewrites one.
    //
    // Three cases, and the distinction is the point. **Admins get `no-store`**: they are the ones
    // editing, and a stale board in the editor would be a data-loss bug rather than a slow reload.
    // **A signed-in player gets `private`**, unchanged — their copy was made for a session, and
    // treating it otherwise is how a shared cache ends up serving one reader's response to another.
    // **An anonymous reader gets `public`**, which is the whole point of the change: a level link
    // that goes round a group should be answered from a cache, not by waking the instance 200 times.
    //
    // `Vary: Authorization` is what keeps those three apart in any cache between here and the
    // reader. Without it, the anonymous copy could be handed to a request that sent a bearer.
    response.vary('Authorization')
    response.setHeader(
      'Cache-Control',
      isAdmin ? 'no-store' : actor ? 'private, max-age=600' : 'public, max-age=600',
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
