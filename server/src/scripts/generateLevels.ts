import 'dotenv/config'

import {
  formatBoardValidationIssue,
  generateUniqueBoard,
  getBullsPerGroupForDifficulty,
  validateBoard,
  type Difficulty,
} from '../../../shared/game'
import { getPrismaClient } from '../db/prismaClient'
import { PrismaLevelRepository } from '../repositories/PrismaLevelRepository'
import { DIFFICULTIES } from '../types/level'

/**
 * Bulk-generates levels that are guaranteed to have exactly one solution.
 *
 *   npm run levels:generate -- --difficulty=medium --count=50              # dry run
 *   npm run levels:generate -- --difficulty=medium --count=50 --write      # actually save
 *
 * **It is a dry run unless you pass `--write`.** A dry run generates and verifies every board and
 * prints what it would do, touching nothing.
 *
 * Options:
 *   --difficulty=light|easy|medium|hard   required
 *   --count=N                             how many levels (default 50)
 *   --start=N                             first level number (default: highest existing + 1)
 *   --title="Level {n}"                   title template; {n} is the level number
 *   --seed=N                              repeat an earlier run exactly (every run prints its seed)
 *   --write                               save to the database
 *   --replace                             overwrite level numbers that already exist, and clear
 *                                         their progress rows
 *
 * Every board is re-validated after generation and the script refuses to save anything that is not
 * uniquely solvable, so a bug in the generator cannot quietly put an ambiguous level in the library.
 *
 * The whole batch is written in **one transaction**, so a run can never land half-finished.
 */

type Options = {
  difficulty: Difficulty
  count: number
  start: number | null
  titleTemplate: string
  seed: number
  write: boolean
  replace: boolean
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

  const readInt = (name: string, fallback: number | null) => {
    const raw = flags.get(name)

    if (raw === undefined) {
      return fallback
    }

    const parsed = Number(raw)

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(`--${name} must be a positive integer`)
    }

    return parsed
  }

  if (flags.has('clear-progress')) {
    throw new Error('--clear-progress is gone: --replace always clears the replaced levels\' progress.')
  }

  return {
    difficulty: difficulty as Difficulty,
    count: readInt('count', 50) as number,
    start: readInt('start', null),
    titleTemplate: flags.get('title') ?? 'Level {n}',
    // Every run is seeded and prints its seed, so any batch can be reproduced after the fact —
    // including one you liked and didn't plan to repeat.
    seed: readInt('seed', null) ?? Math.floor(Math.random() * 0xffffffff),
    write: flags.get('write') === 'true',
    replace: flags.get('replace') === 'true',
  }
}

/**
 * mulberry32 — small, fast, and far better distributed than a plain LCG, whose low bits are barely
 * random at all. Good enough for board generation and it makes `--seed` exactly reproducible.
 */
function createSeededRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function boardSignature(pensByCell: number[], bullsByCell: boolean[]) {
  return `${pensByCell.join(',')}|${bullsByCell.map((bull) => (bull ? 1 : 0)).join('')}`
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  const prisma = getPrismaClient()
  const levelRepository = new PrismaLevelRepository(prisma)

  const existing = await prisma.level.findMany({
    where: { difficulty: options.difficulty },
    select: { levelNumber: true, pensByCell: true, cowsByCell: true },
    orderBy: { levelNumber: 'asc' },
  })

  const existingNumbers = new Set(existing.map((level) => level.levelNumber))
  const highestExisting = existing.length > 0 ? Math.max(...existingNumbers) : 0
  const start = options.start ?? highestExisting + 1
  const targetNumbers = Array.from({ length: options.count }, (_, index) => start + index)
  const collisions = targetNumbers.filter((levelNumber) => existingNumbers.has(levelNumber))

  console.log(
    `${options.difficulty}: ${existing.length} levels stored, highest is ${highestExisting || '-'}`,
  )
  console.log(
    `plan: ${options.count} levels, numbers ${start}-${start + options.count - 1}` +
      `${options.write ? '' : '   (DRY RUN — pass --write to save)'}`,
  )
  console.log(`seed: ${options.seed}   (re-run with --seed=${options.seed} for the same levels)`)

  if (collisions.length > 0) {
    if (!options.replace) {
      throw new Error(
        `These level numbers already exist: ${collisions.join(', ')}.\n` +
          'Pick a different --start, or pass --replace to overwrite them.',
      )
    }

    console.log(`replacing ${collisions.length} existing level(s): ${collisions.join(', ')}`)
    console.log('  their progress rows will be deleted, since the boards are changing')
  }

  // Refuse to emit a board that duplicates another one, in this batch or already in the library.
  const seenSignatures = new Set(
    existing.map((level) =>
      boardSignature(level.pensByCell as number[], level.cowsByCell as boolean[]),
    ),
  )

  const bullsPerGroup = getBullsPerGroupForDifficulty(options.difficulty)
  const random = createSeededRandom(options.seed)
  const generated: Array<{
    levelNumber: number
    gridSize: number
    pensByCell: number[]
    bullsByCell: boolean[]
  }> = []
  const startedAt = Date.now()

  for (const levelNumber of targetNumbers) {
    let accepted: { gridSize: number; pensByCell: number[]; bullsByCell: boolean[] } | null = null

    for (let attempt = 1; attempt <= 12 && !accepted; attempt += 1) {
      const board = generateUniqueBoard(options.difficulty, {
        random,
        // Generous: this is a batch job, not a click in the editor.
        timeBudgetMs: 30000,
        attempts: 200,
      })

      if (!board) {
        console.log(`  level ${levelNumber}: generator gave up (attempt ${attempt})`)
        continue
      }

      // Independent re-check. The generator claims uniqueness; verify it before it reaches the DB.
      const validation = validateBoard(
        { difficulty: options.difficulty, ...board },
        { countSolutions: true, solutionLimit: 2 },
      )

      if (!validation.isValid || validation.solutionCount !== 1) {
        console.log(
          `  level ${levelNumber}: rejected — valid=${validation.isValid} ` +
            `solutions=${validation.solutionCount} ${validation.issues.map(formatBoardValidationIssue).join(' | ')}`,
        )
        continue
      }

      const signature = boardSignature(board.pensByCell, board.bullsByCell)

      if (seenSignatures.has(signature)) {
        console.log(`  level ${levelNumber}: duplicate board, regenerating`)
        continue
      }

      seenSignatures.add(signature)
      accepted = {
        gridSize: board.gridSize,
        pensByCell: board.pensByCell,
        bullsByCell: board.bullsByCell,
      }
      console.log(
        `  level ${levelNumber}: ok (${bullsPerGroup} bull${bullsPerGroup > 1 ? 's' : ''} per group, ` +
          `${board.attempts} attempt${board.attempts > 1 ? 's' : ''}, ${board.elapsedMs}ms)`,
      )
    }

    if (!accepted) {
      throw new Error(
        `Could not produce a uniquely solvable board for level ${levelNumber}. Nothing has been saved.`,
      )
    }

    generated.push({ levelNumber, ...accepted })
  }

  console.log('')
  console.log(
    `generated ${generated.length} uniquely solvable board(s) in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
  )

  if (!options.write) {
    console.log('dry run: nothing was written. Re-run with --write to save.')
    return
  }

  const now = new Date().toISOString()

  // One transaction for the whole batch: a run either saves all of it or none of it. A half-written
  // batch would be the worst outcome — you would have to work out which numbers landed before you
  // could safely re-run.
  const { savedCount, deletedProgressCount } = await levelRepository.saveMany(
    generated.map((board) => ({
      difficulty: options.difficulty,
      levelNumber: board.levelNumber,
      title: options.titleTemplate.replace('{n}', String(board.levelNumber)),
      gridSize: board.gridSize,
      colorsByCell: board.pensByCell,
      cowsByCell: board.bullsByCell,
      createdAt: now,
      updatedAt: now,
    })),
    { replacedLevelNumbers: collisions },
  )

  if (deletedProgressCount > 0) {
    console.log(`deleted ${deletedProgressCount} progress row(s) for the replaced levels`)
  }

  console.log(`saved ${savedCount} level(s) to ${options.difficulty}`)
  console.log('run `npm run levels:audit` to confirm.')
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : error}`)
    process.exit(1)
  })
