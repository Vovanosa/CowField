import { generateUniqueBoard } from '../../../shared/game'
import type { LevelDraft } from '../types'

/**
 * Builds a level draft whose puzzle has exactly one solution.
 *
 * The engine lives in `shared/game/generator.ts`. It replaced a pair of generators (one per bull
 * count) that produced valid but ambiguous boards — measured at 10% unique on light, 1% on easy and
 * 0% on medium and hard — so most of the level library can be finished more than one way.
 *
 * Returns `null` when the search budget runs out. That is a "try again", not an impossibility: the
 * caller should offer to re-run rather than reporting a broken feature.
 */
export function generateLevelDraft(
  levelNumber: number,
  title: string,
  difficulty: LevelDraft['difficulty'],
): LevelDraft | null {
  const board = generateUniqueBoard(difficulty)

  if (!board) {
    return null
  }

  return {
    levelNumber,
    title,
    difficulty,
    gridSize: board.gridSize,
    pensByCell: board.pensByCell,
    cowsByCell: board.bullsByCell,
  }
}
