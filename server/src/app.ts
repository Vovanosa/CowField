import cors from 'cors'
import express from 'express'
import { ZodError } from 'zod'

import { HttpError } from './errors/HttpError'
import { getConfiguredAdminEmail } from './auth/adminAccount'
import { AuthController } from './controllers/authController'
import { createAuthRoutes } from './routes/authRoutes'
import { createLevelRoutes } from './routes/levelRoutes'
import { createPlayerProgressRoutes } from './routes/playerProgressRoutes'
import { createPlayerStatisticsRoutes } from './routes/playerStatisticsRoutes'
import { LevelController } from './controllers/levelController'
import { PlayerProgressController } from './controllers/playerProgressController'
import { PlayerStatisticsController } from './controllers/playerStatisticsController'
import { AuthService } from './services/AuthService'
import { LevelService } from './services/LevelService'
import { PlayerProgressService } from './services/PlayerProgressService'
import { PlayerStatisticsService } from './services/PlayerStatisticsService'
import { createRateLimitMiddleware } from './middleware/rateLimit'
import { createRequestLoggerMiddleware } from './middleware/requestLogger'
import { createSecurityHeadersMiddleware } from './middleware/securityHeaders'
import { createRepositories } from './repositories/createRepositories'
import { getPrismaClient } from './db/prismaClient'

const DEVELOPMENT_ORIGIN = 'http://localhost:5173'

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * The origins the browser may call this API from.
 *
 * **Required in production**, and deliberately fatal when missing rather than defaulted. A wrong
 * default here is not a small mistake: it decides which sites the browser will hand our API a
 * bearer token from, and a deployment that silently fell back to a localhost origin would look
 * healthy while rejecting every real request. Failing at startup is the loud version of the same
 * problem.
 */
function getAllowedOrigins() {
  const configuredOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins
  }

  if (isProduction()) {
    throw new Error(
      'ALLOWED_ORIGINS is required when NODE_ENV=production. Set it to the site the web app is served from, e.g. ALLOWED_ORIGINS=https://cowfield.vercel.app (comma-separated for more than one).',
    )
  }

  return [DEVELOPMENT_ORIGIN]
}

export function createApp() {
  const app = express()

  // Tells nobody anything useful and advertises the stack to a scanner.
  app.disable('x-powered-by')

  // The rate limiter keys on `request.ip`, which behind a proxy is the proxy's own address — every
  // caller would then share one bucket and lock each other out. Set `TRUST_PROXY` (Express's
  // `trust proxy` value: `1`, `loopback`, a CIDR, ...) when the API runs behind one.
  //
  // It stays opt-in rather than defaulted, because trusting `X-Forwarded-For` when nothing strips it
  // lets a caller forge its own rate-limit key — the opposite failure. So neither value is safe to
  // assume, and the only correct thing to do is say so at startup: any real deployment terminates
  // TLS somewhere, so an unset `TRUST_PROXY` in production almost certainly means one shared bucket
  // for every player.
  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', process.env.TRUST_PROXY)
  } else if (isProduction()) {
    console.warn(
      'TRUST_PROXY is not set. If this API runs behind a proxy or load balancer, every caller shares one rate-limit bucket because request.ip is the proxy address. Set TRUST_PROXY to the number of proxies in front of it (usually 1), or to a CIDR you control. Leave it unset only if clients connect to this process directly.',
    )
  }

  const allowedOrigins = new Set(getAllowedOrigins())
  const repositories = createRepositories()
  const levelService = new LevelService(repositories.levelRepository)
  const playerProgressService = new PlayerProgressService(
    repositories.playerProgressRepository,
    repositories.levelRepository,
  )
  const authService = new AuthService(
    repositories.userRepository,
    repositories.sessionRepository,
    getConfiguredAdminEmail(),
    process.env.NEON_AUTH_URL ?? process.env.VITE_NEON_AUTH_URL ?? null,
  )
  const playerStatisticsService = new PlayerStatisticsService(
    repositories.playerProgressRepository,
    repositories.playerStatisticsRepository,
  )
  const authController = new AuthController(authService)
  const levelController = new LevelController(levelService)
  const playerProgressController = new PlayerProgressController(playerProgressService)
  const playerStatisticsController = new PlayerStatisticsController(playerStatisticsService)

  app.use(createSecurityHeadersMiddleware())
  app.use(createRequestLoggerMiddleware())
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true)
          return
        }

        callback(new HttpError(403, 'Origin is not allowed by CORS.'))
      },
      allowedHeaders: ['Authorization', 'Content-Type'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  // A loose backstop over the whole API, after CORS so preflights do not spend anyone's budget.
  // Ten requests a second sustained is an order of magnitude more than playing generates, so this
  // should never fire for a real player — the tight limit that matters is on guest creation in
  // `authRoutes`, the only unauthenticated write left.
  //
  // Note this keys on `request.ip` too, so it is subject to the `TRUST_PROXY` caveat above.
  app.use(
    createRateLimitMiddleware({
      windowMs: 60_000,
      maxRequests: 600,
    }),
  )

  /**
   * Liveness only: is this process up? **Deliberately touches nothing.**
   *
   * This is the target for the keep-alive cron that stops the host spinning the instance down after
   * ~15 minutes idle. It has to be free, because it runs every 10 minutes forever:
   *
   * - **No database.** `/api/health` below runs `SELECT 1`, which is right for a readiness check and
   *   wrong here — pinging it every 10 minutes would keep the *database* compute awake 24/7 as well,
   *   and a serverless Postgres compute allowance is much smaller than the web host's instance
   *   hours. Waking Postgres 144 times a day to learn that Express is running is the wrong trade.
   * - **No logging.** Skipped in `requestLogger`, or the log becomes 144 lines a day of nothing.
   * - **No auth, no body.** Nothing to leak; `ok` and nothing else.
   */
  app.get('/api/ping', (_request, response) => {
    response.json({ ok: true })
  })

  /** Readiness: is the process up *and* the database reachable? Answers with a real query. */
  app.get('/api/health', async (_request, response) => {
    await getPrismaClient().$queryRaw`SELECT 1`
    response.json({
      ok: true,
      storage: 'database',
    })
  })

  app.use('/api/auth', createAuthRoutes(authController))
  app.use('/api/levels', createLevelRoutes(levelController, authService))
  app.use('/api/progress', createPlayerProgressRoutes(playerProgressController, authService))
  app.use('/api/statistics', createPlayerStatisticsRoutes(playerStatisticsController, authService))

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

      // An unexpected 500 used to leave no trace at all — the client got a generic message and the
      // server said nothing. The stack is the only way to find out what actually broke.
      console.error('Unhandled request error:', error)

      response.status(500).json({
        message: 'Unexpected server error.',
      })
    },
  )

  return app
}
