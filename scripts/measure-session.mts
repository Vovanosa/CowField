/**
 * The session measurement harness the P7–P11 programme is judged against.
 *
 * Run it with:
 *
 *     node_modules/.bin/tsx scripts/measure-session.mts              # requests only, no database
 *     node_modules/.bin/tsx scripts/measure-session.mts --queries    # + real Postgres round trips
 *
 * ## Why this file exists
 *
 * `claude/scope-2026-09-data-layer-and-hardening.md` sets two numeric gates — requests and database
 * round trips — and says to keep the harness rather than re-derive it each time, so the before and
 * after stay comparable. Every phase of the programme had been rebuilding a throwaway version of
 * this and deleting it, which made the numbers claims in the logbook rather than checks anyone
 * could repeat.
 *
 * ## The session it replays
 *
 * The one from §1.1 of the scope document, unchanged, because that is what the 50-request baseline
 * was measured on:
 *
 *     boot → /levels → /levels/light → play levels 1, 2, 3
 *     (load each, complete each, return to the list between) → /statistics
 *
 * ## Request mode (the default): no server, no database
 *
 * This is how the original baseline was taken, and why it needs neither. It drives the **real**
 * `src/game/storage/**` modules with a stubbed `fetch`, and records what the layer asks for. That
 * measures the layer's own call pattern — which is where every cache and every deduplication lives
 * — without a network or a database anywhere in the picture.
 *
 * Two things make the real modules loadable under `tsx`:
 *
 *   - `storage/http/` is a leaf, so importing it pulls in no React and no DOM;
 *   - `storage/http/apiBase.ts` wraps its `import.meta.env` reads in a `try`, so they yield
 *     `undefined` here instead of throwing. Requests therefore come out root-relative (`/api/...`),
 *     which is exactly what we want to record.
 *
 * ## Query mode (`--queries`): needs a database, and WRITES to it
 *
 * Counting real Postgres round trips means really running the server, which means really writing
 * rows. So this mode is opt-in twice — `--queries` plus one of:
 *
 *   --live                      use the DATABASE_URL already in .env
 *   MEASURE_DATABASE_URL=...    use some other database instead
 *
 * `--queries` on its own refuses to run. The point of the second opt-in is that nobody writes to
 * the live database by typing one flag; `--live` says it out loud. Prefer `--live` over putting a
 * connection string on a command line, where it would show up in shell history and process lists.
 *
 * What it creates and then deletes: one `users` row, one `sessions` row, and whatever
 * `level_progress` / `player_statistics_totals` rows the three completions produce. Cleanup runs in
 * a `finally`. The session row is an opaque token rather than a Neon JWT — `getSessionByToken`
 * accepts those for any role, which is how a guest authenticates — so no Neon account is involved.
 */
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const require = createRequire(`${ROOT}/package.json`)

const WANTS_QUERIES = process.argv.includes('--queries')
const WANTS_LIVE_DATABASE = process.argv.includes('--live')

/** From the scope document's definition of done. */
const REQUEST_GATE = 14
const QUERY_GATE = 45

type RecordedRequest = {
  method: string
  url: string
}

const requests: RecordedRequest[] = []

/** Every Postgres statement the server sent, in order, while the replay was running. */
const queries: string[] = []

// ---------------------------------------------------------------- the browser the layer expects

const storageBacking = new Map<string, string>()

;(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (key: string) => storageBacking.get(key) ?? null,
    setItem: (key: string, value: string) => void storageBacking.set(key, value),
    removeItem: (key: string) => void storageBacking.delete(key),
  },
  location: { origin: 'http://localhost:5173' },
  addEventListener: () => {},
  removeEventListener: () => {},
}

/** The layer only ever reads the role to decide guest vs. server, and the token to authenticate. */
function signInAs(role: 'user' | 'guest', token: string) {
  storageBacking.set('cowfield.auth-session-role', role)

  if (role === 'guest') {
    storageBacking.set('cowfield.guest-session-token', token)
  } else {
    // An opaque bearer for an account. `bearer.ts` prefers a stored token over asking Neon, which is
    // what keeps `/token` out of the count here — in a browser that fetch is one per page load.
    storageBacking.set('cowfield.guest-session-token', token)
  }
}

// ---------------------------------------------------------------- fetch

const realFetch = globalThis.fetch

function installRecordingFetch(baseUrl: string | null, respond: ((url: string) => unknown) | null) {
  ;(globalThis as Record<string, unknown>).fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = (init?.method ?? 'GET').toUpperCase()

    requests.push({ method, url: rawUrl })

    if (baseUrl) {
      const absolute = rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`
      return realFetch(absolute, init)
    }

    const body = respond ? respond(rawUrl) : {}

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/** Canned answers shaped like the real endpoints, for the no-server mode. */
function cannedResponse(url: string): unknown {
  if (url.includes('/api/auth/me')) {
    return { role: 'user', email: 'probe@example.com', displayName: 'Probe' }
  }

  if (url.includes('/api/progress/overview')) {
    return {
      difficulties: ['light', 'easy', 'medium', 'hard'].map((difficulty) => ({
        difficulty,
        totalCount: 200,
        completedCount: 0,
      })),
    }
  }

  if (/\/api\/levels\/[a-z]+$/.test(url)) {
    return {
      difficulty: 'light',
      levelNumbers: Array.from({ length: 200 }, (_, index) => index + 1),
    }
  }

  const boardMatch = /\/api\/levels\/([a-z]+)\/(\d+)/.exec(url)
  if (boardMatch) {
    const levelNumber = Number(boardMatch[2])
    return {
      difficulty: boardMatch[1],
      levelNumber,
      gridSize: 6,
      colorsByCell: new Array(36).fill(1),
      nextLevelNumber: levelNumber + 1,
    }
  }

  if (url.includes('/complete')) {
    const completeMatch = /\/api\/progress\/([a-z]+)\/(\d+)\/complete/.exec(url)
    return {
      progress: {
        difficulty: completeMatch?.[1] ?? 'light',
        levelNumber: Number(completeMatch?.[2] ?? 1),
        bestTimeSeconds: 42,
      },
      isNewBest: true,
    }
  }

  if (/\/api\/progress\/[a-z]+$/.test(url)) {
    return { difficulty: 'light', bestTimes: {} }
  }

  if (url.includes('/api/statistics')) {
    return {
      totalCompletedLevels: 3,
      totalBullPlacements: 18,
      totalCompletionTimeSeconds: 126,
      byDifficulty: ['light', 'easy', 'medium', 'hard'].map((difficulty) => ({
        difficulty,
        completedLevels: difficulty === 'light' ? 3 : 0,
        fastestLevel: null,
        averageTimeSeconds: null,
      })),
    }
  }

  return {}
}

// ---------------------------------------------------------------- the session

/**
 * Replays §1.1 exactly. Each numbered step is one screen the player would land on, and the loads
 * inside it are the ones that screen's effects actually run.
 */
async function replaySession() {
  const storage = await import(`file:///${ROOT}/src/game/storage/resources/index.ts`)
  const levelStorage = await import(`file:///${ROOT}/src/game/storage/levelStorage.ts`)
  const auth = await import(`file:///${ROOT}/src/game/storage/authSessionStorage.ts`)

  const trace: Array<{ step: string; requests: number }> = []
  let seen = 0

  function mark(step: string) {
    trace.push({ step, requests: requests.length - seen })
    seen = requests.length
  }

  // 1. Boot: AuthProvider restores the session.
  await auth.getCurrentSession()
  mark('boot (/me)')

  // 2. /levels — the difficulty chooser.
  await storage.getDifficultyOverview()
  mark('/levels')

  // 3. /levels/light — catalogue + progress, in parallel.
  await storage.getDifficultyLevelsPageData('light')
  mark('/levels/light')

  for (const levelNumber of [1, 2, 3]) {
    // 4. The game page: the board, plus this level's best time and the previous level's (the
    //    unlock check). Both progress reads are lookups in the cached collection, not requests.
    await levelStorage.getLevelByDifficultyAndNumber('light', levelNumber)
    await storage.getBestTime('light', levelNumber)

    if (levelNumber > 1) {
      await storage.getBestTime('light', levelNumber - 1)
    }

    mark(`load level ${levelNumber}`)

    // 5. Completion, with the bull placements merged into the same write.
    await storage.completeLevelProgress('light', levelNumber, 42, { bullPlacements: 6 })
    mark(`complete level ${levelNumber}`)

    // 6. Back to the list.
    await storage.getDifficultyLevelsPageData('light')
    mark(`back to /levels/light after ${levelNumber}`)
  }

  // 7. /statistics
  await storage.getPlayerStatistics()
  mark('/statistics')

  return trace
}

// ---------------------------------------------------------------- reporting

/**
 * Splits the statements into the ones a handler asked for and the ones the driver adds around them.
 *
 * Transaction control is a real round trip and is counted, but it is not a query anyone wrote — the
 * distinction is what tells you whether a number over budget is the application's doing.
 */
function summariseQueries() {
  const isTransactionControl = (query: string) =>
    /^(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|DEALLOCATE|SET |START TRANSACTION)/i.test(query)
  const isWrite = (query: string) => /^(INSERT|UPDATE|DELETE)/i.test(query)

  const control = queries.filter(isTransactionControl)
  const writes = queries.filter((query) => !isTransactionControl(query) && isWrite(query))
  const reads = queries.filter((query) => !isTransactionControl(query) && !isWrite(query))

  /**
   * The harness's own cost, which a real session does not pay.
   *
   * Authenticating here uses an **opaque** bearer out of the `sessions` table, because minting a
   * Neon JWT would need a real Neon account. `getSessionByToken` resolves an opaque token with a
   * row lookup **every request** — that is how a guest works. An `admin`/`user` browser session
   * sends a Neon JWT instead, which is verified against cached JWKS and answered from the in-memory
   * user cache, costing **zero** queries once warm (plan items 41–43).
   *
   * So these are counted, shown, and then subtracted: the gate is about what a player costs.
   */
  const harnessSessionLookups = reads.filter((query) =>
    /FROM\s+"public"\."sessions"/i.test(query),
  )

  return { control, writes, reads, harnessSessionLookups }
}

function report(trace: Array<{ step: string; requests: number }>, measuredQueries: boolean) {
  let measuredPlayerQueries: number | null = null

  console.log('\nPer-step requests')
  for (const entry of trace) {
    console.log(`  ${String(entry.requests).padStart(2)}  ${entry.step}`)
  }

  const byUrl = new Map<string, number>()
  for (const request of requests) {
    const key = `${request.method} ${request.url}`
    byUrl.set(key, (byUrl.get(key) ?? 0) + 1)
  }

  const repeated = [...byUrl.entries()].filter(([, count]) => count > 1)

  console.log('\nEvery request, once each')
  for (const [key, count] of byUrl) {
    console.log(`  ${count}x  ${key}`)
  }

  console.log('\n--- gates ---')
  console.log(`requests      : ${requests.length}  (gate: <= ${REQUEST_GATE}, baseline 50)`)
  console.log(`repeated URLs : ${repeated.length}  (gate: 0, baseline 6)`)

  if (repeated.length > 0) {
    for (const [key, count] of repeated) {
      console.log(`                ${count}x ${key}`)
    }
  }

  if (measuredQueries) {
    const { control, writes, reads, harnessSessionLookups } = summariseQueries()
    const playerQueries = queries.length - harnessSessionLookups.length

    console.log(`queries       : ${playerQueries}  (gate: < ${QUERY_GATE}, baseline ~152)`)
    console.log(`  reads              : ${reads.length - harnessSessionLookups.length}`)
    console.log(`  writes             : ${writes.length}  (baseline 28)`)
    console.log(`  transaction control: ${control.length}  (BEGIN/COMMIT/etc, driver-issued)`)
    console.log(
      `  measured total     : ${queries.length}, minus ${harnessSessionLookups.length} sessions lookups the harness pays`,
    )
    console.log(
      '                       and a Neon-JWT session does not — see summariseQueries()',
    )

    const byTable = new Map<string, number>()
    for (const query of [...reads, ...writes]) {
      const match = /(?:from|into|update|join)\s+"?(?:public"?\.)?"?([a-z_]+)"?/i.exec(query)
      const table = match?.[1] ?? 'other'
      byTable.set(table, (byTable.get(table) ?? 0) + 1)
    }

    console.log('  by table:')
    for (const [table, count] of [...byTable.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(count).padStart(3)}  ${table}`)
    }

    // Over budget is only actionable if you can see what ran.
    if (playerQueries >= QUERY_GATE) {
      console.log('\n  over the gate — every statement, in order:')
      queries.forEach((query, index) => {
        console.log(`    [${String(index + 1).padStart(2)}] ${query.replace(/\s+/g, ' ').slice(0, 120)}`)
      })
    }

    measuredPlayerQueries = playerQueries
  } else {
    console.log('queries       : not measured (pass --queries --live)')
  }

  const requestsPass = requests.length <= REQUEST_GATE && repeated.length === 0
  const queriesPass = measuredPlayerQueries === null || measuredPlayerQueries < QUERY_GATE

  console.log(`\n${requestsPass && queriesPass ? 'PASS' : 'FAIL'}`)
  return requestsPass && queriesPass
}

// ---------------------------------------------------------------- modes

async function runRequestsOnly() {
  signInAs('user', 'measure-harness-token')
  installRecordingFetch(null, cannedResponse)
  const trace = await replaySession()
  return report(trace, false)
}

async function runWithQueries() {
  // The server reads more than the database URL — the configured admin email, the Neon settings —
  // so `.env` is loaded either way. An explicit override is applied *after*, so it always wins.
  require('dotenv/config')

  const overrideUrl = process.env.MEASURE_DATABASE_URL?.trim()

  if (!overrideUrl && !WANTS_LIVE_DATABASE) {
    console.error(
      'Query mode needs a database, and it WRITES to it.\n\n' +
        'It creates a throwaway user, a session, and the progress rows three completions produce,\n' +
        'then deletes all of them. Say which database out loud:\n\n' +
        '  ... scripts/measure-session.mts --queries --live   use DATABASE_URL from .env\n' +
        '  MEASURE_DATABASE_URL=... ... --queries             use a different one\n',
    )
    process.exit(1)
  }

  if (overrideUrl) {
    process.env.DATABASE_URL = overrideUrl
  }

  process.env.PRISMA_QUERY_LOG = '1'

  const { getPrismaClient } = await import(`file:///${ROOT}/server/src/db/prismaClient.ts`)
  const { createApp } = await import(`file:///${ROOT}/server/src/app.ts`)

  const prisma = getPrismaClient()

  let isCounting = false

  // Only what the replay causes: the fixture rows are created before this flips on, and removed
  // after it flips off.
  prisma.$on('query', (event: { query: string }) => {
    if (isCounting) {
      queries.push(event.query.trim())
    }
  })

  // A throwaway account and an opaque bearer for it. No Neon involvement: `getSessionByToken`
  // resolves a non-JWT token from the `sessions` table for any role, which is how guests work.
  const userId = randomUUID()
  const token = `measure-${randomUUID()}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)

  const server = createApp().listen(0)
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: `measure-${userId}@harness.invalid`,
        role: 'user',
        displayName: 'Measurement Harness',
        createdAt: now,
        updatedAt: now,
      },
    })

    await prisma.session.create({
      data: {
        token,
        actorKey: `user:${userId}`,
        actorType: 'user',
        role: 'user',
        userId,
        email: `measure-${userId}@harness.invalid`,
        displayName: 'Measurement Harness',
        createdAt: now,
        updatedAt: now,
        expiresAt,
      },
    })

    signInAs('user', token)
    installRecordingFetch(`http://127.0.0.1:${port}`, null)

    isCounting = true
    const trace = await replaySession()
    // Query events arrive asynchronously; give the last few a tick to land.
    await new Promise((resolve) => setTimeout(resolve, 500))
    isCounting = false

    return report(trace, true)
  } finally {
    isCounting = false
    server.close()

    // Order matters: progress and totals cascade from the user, but be explicit so a partial run
    // still cleans up.
    await prisma.levelProgress.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.playerStatisticsTotal.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.session.deleteMany({ where: { token } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {})
    await prisma.$disconnect().catch(() => {})
    console.log('\nfixture rows removed')
  }
}

const passed = WANTS_QUERIES ? await runWithQueries() : await runRequestsOnly()
process.exit(passed ? 0 : 1)
