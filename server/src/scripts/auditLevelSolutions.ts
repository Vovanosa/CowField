import 'dotenv/config'

import {
  formatBoardValidationIssue,
  getBullsPerGroupForDifficulty,
  solveBoard,
  validateBoard,
  type Difficulty,
} from '../../../shared/game'
import { getPrismaClient } from '../db/prismaClient'

/**
 * Read-only audit of every stored level: does its puzzle have exactly one solution?
 *
 * Levels authored before the generator was rewritten are almost all ambiguous — the old generator
 * only checked that a solution existed, never that it was the only one. Run this to see how much of
 * the library that affects. It writes nothing.
 *
 *   npm run levels:audit
 */

const SOLUTION_LIMIT = 200

type Row = {
  difficulty: Difficulty
  levelNumber: number
  title: string
  solutions: number
  reachedLimit: boolean
  ruleIssues: string[]
}

function asNumberArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => Number(entry)) : []
}

function asBooleanArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => Boolean(entry)) : []
}

async function main() {
  const prisma = getPrismaClient()
  const levels = await prisma.level.findMany({
    orderBy: [{ difficulty: 'asc' }, { levelNumber: 'asc' }],
  })

  if (levels.length === 0) {
    console.log('No levels stored.')
    return
  }

  const rows: Row[] = []

  for (const level of levels) {
    const difficulty = level.difficulty as Difficulty
    const board = {
      gridSize: level.gridSize,
      pensByCell: asNumberArray(level.pensByCell),
      bullsByCell: asBooleanArray(level.cowsByCell),
    }
    const bullsPerGroup = getBullsPerGroupForDifficulty(difficulty)
    const validation = validateBoard({ difficulty, ...board })
    const solved = solveBoard(board, bullsPerGroup, { limit: SOLUTION_LIMIT })

    rows.push({
      difficulty,
      levelNumber: level.levelNumber,
      title: level.title,
      solutions: solved.count,
      reachedLimit: solved.reachedLimit,
      ruleIssues: validation.issues.map(formatBoardValidationIssue),
    })
  }

  const width = Math.max(...rows.map((row) => row.title.length), 5)

  console.log(
    `${'difficulty'.padEnd(11)}${'lvl'.padStart(4)}  ${'title'.padEnd(width)}  solutions  rule issues`,
  )

  for (const row of rows) {
    const solutions = row.reachedLimit ? `${row.solutions}+` : String(row.solutions)
    const flag = row.solutions === 1 ? ' ' : '!'
    console.log(
      `${flag}${row.difficulty.padEnd(10)}${String(row.levelNumber).padStart(4)}  ` +
        `${row.title.padEnd(width)}  ${solutions.padStart(9)}  ${row.ruleIssues.length === 0 ? '-' : row.ruleIssues.join(' | ')}`,
    )
  }

  const unique = rows.filter((row) => row.solutions === 1).length
  const unsolvable = rows.filter((row) => row.solutions === 0).length
  const broken = rows.filter((row) => row.ruleIssues.length > 0).length

  console.log('')
  console.log(`levels: ${rows.length}`)
  console.log(`exactly one solution: ${unique}`)
  console.log(`more than one solution: ${rows.length - unique - unsolvable}`)
  console.log(`no solution at all: ${unsolvable}`)
  console.log(`failing the rule checks: ${broken}`)

  const byDifficulty = new Map<Difficulty, { total: number; unique: number }>()

  for (const row of rows) {
    const entry = byDifficulty.get(row.difficulty) ?? { total: 0, unique: 0 }
    entry.total += 1
    if (row.solutions === 1) {
      entry.unique += 1
    }
    byDifficulty.set(row.difficulty, entry)
  }

  for (const [difficulty, entry] of byDifficulty) {
    console.log(`  ${difficulty.padEnd(7)} ${entry.unique}/${entry.total} unique`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
