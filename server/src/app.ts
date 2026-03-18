import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { ZodError } from 'zod'

import { HttpError } from './errors/HttpError'
import { FileContentRepository } from './repositories/FileContentRepository'
import { FileLevelRepository } from './repositories/FileLevelRepository'
import { createContentRoutes } from './routes/contentRoutes'
import { createLevelRoutes } from './routes/levelRoutes'
import { ContentController } from './controllers/contentController'
import { LevelController } from './controllers/levelController'
import { ContentService } from './services/ContentService'
import { LevelService } from './services/LevelService'

export function createApp() {
  const app = express()
  const repository = new FileLevelRepository(
    path.resolve(process.cwd(), 'levels_data'),
  )
  const contentRepository = new FileContentRepository(
    path.resolve(process.cwd(), 'content_data'),
  )
  const levelService = new LevelService(repository)
  const contentService = new ContentService(contentRepository)
  const levelController = new LevelController(levelService)
  const contentController = new ContentController(contentService)

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.use('/api/levels', createLevelRoutes(levelController))
  app.use('/api/content', createContentRoutes(contentController))

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      void next

      if (error instanceof ZodError) {
        response.status(400).json({
          message: 'Invalid request payload.',
          issues: error.issues.map((issue) => issue.message),
        })
        return
      }

      if (error instanceof HttpError) {
        response.status(error.statusCode).json({
          message: error.message,
        })
        return
      }

      response.status(500).json({
        message: 'Unexpected server error.',
      })
    },
  )

  return app
}
