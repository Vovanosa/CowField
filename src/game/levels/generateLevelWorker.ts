/// <reference lib="webworker" />

import { generateUniqueBoard, type Difficulty, type GeneratedBoard } from '../../../shared/game'

export type GenerateLevelWorkerRequest = {
  difficulty: Difficulty
}

export type GenerateLevelWorkerResponse =
  | { ok: true; board: GeneratedBoard | null }
  | { ok: false; message: string }

/**
 * Runs the level generator off the main thread.
 *
 * The search is CPU-bound and, measured across 25 runs per difficulty, takes a median of 397ms on
 * medium with a p90 of 1.6s and a worst case of the full 6s budget. On the main thread that is a
 * frozen tab: no scrolling, no clicks, and the "Generating..." state cannot even paint. Hard is
 * milder (median 63ms, p90 586ms) and light and easy are a few milliseconds.
 *
 * `shared/game/generator.ts` is a natural fit for a worker precisely because of the rule that keeps
 * it free of DOM, Node and env access — there is nothing in it that needs a window.
 */
self.onmessage = (event: MessageEvent<GenerateLevelWorkerRequest>) => {
  let response: GenerateLevelWorkerResponse

  try {
    response = { ok: true, board: generateUniqueBoard(event.data.difficulty) }
  } catch (error) {
    // A throw in here would otherwise surface as a bare `error` event with no detail. Report it as
    // a message so the caller can show something and log something.
    response = {
      ok: false,
      message: error instanceof Error ? error.message : 'Level generation failed.',
    }
  }

  self.postMessage(response)
}
