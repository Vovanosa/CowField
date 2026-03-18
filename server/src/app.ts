import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { ZodError } from 'zod'

import { HttpError } from './errors/HttpError'
import { FileLevelRepository } from './repositories/FileLevelRepository'
import { createLevelRoutes } from './routes/levelRoutes'
import { LevelController } from './controllers/levelController'
import { LevelService } from './services/LevelService'

export function createApp() {
  const app = express()
  const repository = new FileLevelRepository(
    path.resolve(process.cwd(), 'levels_data'),
  )
  const levelService = new LevelService(repository)
  const levelController = new LevelController(levelService)

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.use('/api/levels', createLevelRoutes(levelController))

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
