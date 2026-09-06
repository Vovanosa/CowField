/// <reference lib="webworker" />

import { validateLevelDraft, type LevelValidationResult } from './levelValidator'
import type { LevelDraft } from '../types'

export type ValidateLevelWorkerRequest = {
  draft: LevelDraft
}

export type ValidateLevelWorkerResponse =
  | { ok: true; result: LevelValidationResult }
  | { ok: false; message: string }

/**
 * Runs the editor's draft validation off the main thread.
 *
 * Validation is the *same* CPU-bound search the generator runs — `validateBoard` calls `solveBoard`
 * with a solution ceiling of 100, and counting to 100 on a 10×10 board is strictly more work than
 * the generator's "is there a second solution?" question, which stops at 2. Generation was moved
 * into a worker for exactly that reason and validation was left behind, so pressing **Validate** or
 * **Save** on a medium or hard board froze the tab with no way to show a pending state.
 *
 * `shared/game/` is free of DOM, Node and env access by rule, which is what makes it runnable here
 * without adaptation.
 */
self.onmessage = (event: MessageEvent<ValidateLevelWorkerRequest>) => {
  let response: ValidateLevelWorkerResponse

  try {
    response = { ok: true, result: validateLevelDraft(event.data.draft) }
  } catch (error) {
    // A throw in here would otherwise surface as a bare `error` event with no detail. Report it as
    // a message so the caller can show something and log something.
    response = {
      ok: false,
      message: error instanceof Error ? error.message : 'Level validation failed.',
    }
  }

  self.postMessage(response)
}
