import 'dotenv/config'

import {
  formatBoardValidationIssue,
  generateUniqueBoard,
  getVerificationNodeBudget,
  validateBoard,
  type Difficulty,
} from '../../../shared/game'
import { getPrismaClient } from '../db/prismaClient'
import { PrismaLevelRepository } from '../repositories/PrismaLevelRepository'
import { DIFFICULTIES } from '../types/level'
import { MAX_SOLUTIONS_BY_DIFFICULTY } from './levelQuality'

/**
 * Tops a difficulty up to a target level count, **saving one level at a time**.
 *
 *   npm run levels:fill -- --difficulty=extreme --target=200
 *
 * The difference from `levels:generate` is the commit boundary, and it is the whole point.
 * `levels:generate` writes its batch in one transaction, which is right when you want fifty levels
 * or none. This writes each level on its own, so a long run is **visible as it goes** — a level
 * appears in the app the moment it is made — and an interruption keeps everything already made.
 *
 * That also makes it resumable: it reads the current count at startup, so running it again after a
 * stop simply continues. There is no state anywhere but the database.
 *
 * Options:
 *   --difficulty=light|easy|medium|hard|extreme   required
 *   --target=N                                    stop once the difficulty has this many (default 200)
 *   --title="Level {n}"                           title template; {n} is the level number
 *
 * Every board is re-validated before it is saved, exactly as in `levels:generate`, against the
 * shared `MAX_SOLUTIONS_BY_DIFFICULTY` — a top-up cannot hold the library to a lower standard than
 * a batch did.
 */

const DEFAULT_TARGET = 200

/** Consecutive failures before giving up. The generator is random; one bad run means nothing. */
const MAX_CONSECUTIVE_FAILURES = 25

type Options = {
  difficulty: Difficulty
  target: number
  titleTemplate: string
}

function parseOptions(argv: string[]): Options {
  const flags = new Map<string, string>()

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`)
    }

    const [name, value] = arg.slice(2).split('=')
    flags.set(name, value ?? 'true')
  }

  const difficulty = flags.get('difficulty')

  if (!difficulty || !DIFFICULTIES.includes(difficulty as Difficulty)) {
    throw new Error(`--difficulty must be one of ${DIFFICULTIES.join(', ')}`)
  }

  const rawTarget = flags.get('target')
  const target = rawTarget === undefined ? DEFAULT_TARGET : Number(rawTarget)

  if (!Number.isInteger(target) || target < 1) {
    throw new Error('--target must be a positive integer')
  }

  return {
    difficulty: difficulty as Difficulty,
    target,
    titleTemplate: flags.get('title') ?? 'Level {n}',
  }
}

function boardSignature(pensByCell: number[], bullsByCell: boolean[]) {
  return `${pensByCell.join(',')}|${bullsByCell.map((bull) => (bull ? 1 : 0)).join('')}`
}

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)

  return minutes > 0 ? `${minutes}m ${totalSeconds % 60}s` : `${totalSeconds}s`
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  const prisma = getPrismaClient()
  const levelRepository = new PrismaLevelRepository(prisma)
  const maxSolutions = MAX_SOLUTIONS_BY_DIFFICULTY[options.difficulty]

  const existing = await prisma.level.findMany({
    where: { difficulty: options.difficulty },
    select: { levelNumber: true, pensByCell: true, cowsByCell: true },
    orderBy: { levelNumber: 'asc' },
  })

  // Every board already in this difficulty, so a top-up cannot re-emit one the library has.
  const seenSignatures = new Set(
    existing.map((level) =>
      boardSignature(level.pensByCell as number[], level.cowsByCell as boolean[]),
    ),
  )

  let stored = existing.length
  let nextLevelNumber = existing.reduce((highest, level) => Math.max(highest, level.levelNumber), 0) + 1

  console.log(`${options.difficulty}: ${stored} stored, target ${options.target}`)

  if (stored >= options.target) {
    console.log('nothing to do.')
    return
  }

  console.log(`making ${options.target - stored} more, one at a time — each is saved as it is made.`)
  console.log('safe to stop at any point; re-running continues from wherever it got to.\n')

  /*
    Ctrl-C finishes the level in flight rather than killing it mid-save.

    A second Ctrl-C still hard-exits, because a user who asks twice means it.
  */
  let shouldStop = false
  process.on('SIGINT', () => {
    if (shouldStop) {
      process.exit(130)
    }

    shouldStop = true
    console.log('\nstopping after the current level...')
  })

  const startedAt = Date.now()
  let made = 0
  let consecutiveFailures = 0

  while (stored < options.target && !shouldStop) {
    const levelStartedAt = Date.now()
    const board = generateUniqueBoard(options.difficulty, {
      timeBudgetMs: 30000,
      attempts: 200,
      maxSolutions,
    })

    if (!board) {
      consecutiveFailures += 1
      console.log(`  level ${nextLevelNumber}: generator gave up (${consecutiveFailures} in a row)`)

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        throw new Error(
          `Gave up ${MAX_CONSECUTIVE_FAILURES} times in a row on ${options.difficulty}. ` +
            `${made} level(s) were saved and are keepers; nothing is half-written.`,
        )
      }

      continue
    }

    const validation = validateBoard(
      { difficulty: options.difficulty, ...board },
      {
        countSolutions: true,
        solutionLimit: maxSolutions + 1,
        maxNodes: getVerificationNodeBudget(options.difficulty),
      },
    )

    if (
      !validation.isValid ||
      validation.solutionCount == null ||
      validation.solutionCount < 1 ||
      validation.solutionCount > maxSolutions
    ) {
      consecutiveFailures += 1
      console.log(
        `  level ${nextLevelNumber}: rejected — valid=${validation.isValid} ` +
          `solutions=${validation.solutionCount} ` +
          `${validation.issues.map(formatBoardValidationIssue).join(' | ')}`,
      )
      continue
    }

    const signature = boardSignature(board.pensByCell, board.bullsByCell)

    if (seenSignatures.has(signature)) {
      consecutiveFailures += 1
      console.log(`  level ${nextLevelNumber}: rejected — duplicate of a board already stored`)
      continue
    }

    const now = new Date().toISOString()
    await levelRepository.saveMany(
      [
        {
          difficulty: options.difficulty,
          levelNumber: nextLevelNumber,
          title: options.titleTemplate.replace('{n}', String(nextLevelNumber)),
          gridSize: board.gridSize,
          colorsByCell: board.pensByCell,
          cowsByCell: board.bullsByCell,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { replacedLevelNumbers: [] },
    )

    seenSignatures.add(signature)
    stored += 1
    made += 1
    consecutiveFailures = 0

    const elapsed = Date.now() - startedAt
    const remaining = options.target - stored
    const eta = made > 0 ? formatDuration((elapsed / made) * remaining) : '?'

    console.log(
      `  level ${nextLevelNumber}: saved (${validation.solutionCount} solution` +
        `${validation.solutionCount === 1 ? '' : 's'}, ${Date.now() - levelStartedAt}ms) — ` +
        `${stored}/${options.target} stored, ${remaining} to go, ~${eta} left`,
    )

    nextLevelNumber += 1
  }

  console.log(
    `\n${made} level(s) saved in ${formatDuration(Date.now() - startedAt)}. ` +
      `${options.difficulty} now has ${stored}.`,
  )

  if (stored < options.target) {
    console.log(`stopped early — re-run to continue to ${options.target}.`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : error}`)
    process.exit(1)
  })
