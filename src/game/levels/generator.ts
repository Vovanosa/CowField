import { generateUniqueBoard, type GeneratedBoard } from '../../../shared/game'
import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import type { LevelDraft } from '../types'
import type {
  GenerateLevelWorkerRequest,
  GenerateLevelWorkerResponse,
} from './generateLevelWorker'

function toLevelDraft(
  board: GeneratedBoard,
  levelNumber: number,
  title: string,
  difficulty: LevelDraft['difficulty'],
): LevelDraft {
  return {
    levelNumber,
    title,
    difficulty,
    gridSize: board.gridSize,
    pensByCell: board.pensByCell,
    cowsByCell: board.bullsByCell,
  }
}

/**
 * Runs the generator in a worker, resolving with the board it found (or `null` on a budget
 * exhaustion).
 *
 * A fresh worker per call, terminated as soon as it answers: startup is a few milliseconds against
 * a search that averages hundreds, and it means no state survives between runs and a stuck search
 * can always be killed.
 */
function generateBoardInWorker(difficulty: LevelDraft['difficulty']) {
  return new Promise<GeneratedBoard | null>((resolve, reject) => {
    const worker = new Worker(new URL('./generateLevelWorker.ts', import.meta.url), {
      type: 'module',
    })

    function finish(outcome: () => void) {
      worker.terminate()
      outcome()
    }

    worker.onmessage = (event: MessageEvent<GenerateLevelWorkerResponse>) => {
      const response = event.data

      finish(() =>
        response.ok ? resolve(response.board) : reject(new Error(response.message)),
      )
    }

    // Fires when the worker itself fails to load or throws outside the handler — a bundling problem,
    // typically. Rejecting lets the caller fall back to the main thread rather than hanging forever.
    worker.onerror = (event) => {
      finish(() => reject(new Error(event.message || 'Level generation worker failed.')))
    }

    worker.postMessage({ difficulty } satisfies GenerateLevelWorkerRequest)
  })
}

/**
 * Builds a level draft whose puzzle has exactly one solution.
 *
 * The engine lives in `shared/game/generator.ts`. It replaced a pair of generators (one per bull
 * count) that produced valid but ambiguous boards — measured at 10% unique on light, 1% on easy and
 * 0% on medium and hard — so most of the level library can be finished more than one way.
 *
 * Async because the search runs in a **worker**: it is CPU-bound and blocked the tab for up to six
 * seconds on medium. See `generateLevelWorker.ts` for the measurements.
 *
 * Returns `null` when the search budget runs out. That is a "try again", not an impossibility: the
 * caller should offer to re-run rather than reporting a broken feature.
 */
export async function generateLevelDraft(
  levelNumber: number,
  title: string,
  difficulty: LevelDraft['difficulty'],
): Promise<LevelDraft | null> {
  let board: GeneratedBoard | null

  try {
    board = await generateBoardInWorker(difficulty)
  } catch (error) {
    // Workers are unavailable or broken. Generating on the main thread freezes the tab, but a frozen
    // tab that produces a level beats a feature that does nothing — so fall back rather than fail.
    reportUnexpectedError(error, 'level generation worker; falling back to the main thread')
    board = generateUniqueBoard(difficulty)
  }

  return board ? toLevelDraft(board, levelNumber, title, difficulty) : null
}
