import { validateLevelDraft, type LevelValidationResult } from './levelValidator'
import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import type { LevelDraft } from '../types'
import type {
  ValidateLevelWorkerRequest,
  ValidateLevelWorkerResponse,
} from './validateLevelWorker'

/**
 * Runs the draft validation in a worker, resolving with the same result the synchronous function
 * would have returned.
 *
 * A fresh worker per call, terminated as soon as it answers — the same shape as
 * `game/levels/generator.ts`, and for the same reasons: startup is a few milliseconds against a
 * search that can take hundreds, no state survives between runs, and a stuck search can be killed.
 */
function validateInWorker(draft: LevelDraft) {
  return new Promise<LevelValidationResult>((resolve, reject) => {
    const worker = new Worker(new URL('./validateLevelWorker.ts', import.meta.url), {
      type: 'module',
    })

    function finish(outcome: () => void) {
      worker.terminate()
      outcome()
    }

    worker.onmessage = (event: MessageEvent<ValidateLevelWorkerResponse>) => {
      const response = event.data

      finish(() =>
        response.ok ? resolve(response.result) : reject(new Error(response.message)),
      )
    }

    // Fires when the worker itself fails to load or throws outside the handler — a bundling problem,
    // typically. Rejecting lets the caller fall back to the main thread rather than hanging forever.
    worker.onerror = (event) => {
      finish(() => reject(new Error(event.message || 'Level validation worker failed.')))
    }

    worker.postMessage({ draft } satisfies ValidateLevelWorkerRequest)
  })
}

/**
 * Validates an editor draft without blocking the tab.
 *
 * The rule checks are trivial; the cost is the solution count, which is the same backtracking search
 * the generator runs — with a *higher* ceiling (100 rather than 2), so it is the more expensive of
 * the two. Generation moved to a worker on that basis and validation did not, which left **Validate**
 * and **Save** freezing the editor on medium and hard.
 *
 * Falls back to the main thread if workers are unavailable, exactly as generation does: a frozen tab
 * that answers beats a button that does nothing.
 */
export async function validateLevelDraftAsync(draft: LevelDraft): Promise<LevelValidationResult> {
  try {
    return await validateInWorker(draft)
  } catch (error) {
    reportUnexpectedError(error, 'level validation worker; falling back to the main thread')
    return validateLevelDraft(draft)
  }
}
