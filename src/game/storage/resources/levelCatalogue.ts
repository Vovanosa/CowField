import type { Difficulty } from '../../types'
import { createResource } from '../cache'
import { buildApiUrl, requestOptionallyAuthenticatedJson } from '../http'

/**
 * Which level numbers exist in a difficulty — **immutable until an admin writes**, cached for the
 * session.
 *
 * That really is the whole contract. A level card renders its number and a best time; it has never
 * shown a title, a grid size or a timestamp. The response used to carry all of them per level, plus
 * the difficulty repeated on every row: **30 KB for 200 levels, of which 0.7 KB was information.**
 *
 * This also used to live inside a cache keyed by *page* — `difficultyLevelsPageStorage` held the
 * level list and the player's progress in one entry, so finishing a level evicted both and the whole
 * catalogue was downloaded again. Keeping it a separate resource is the fix: progress moves
 * constantly, this does not move at all unless an admin saves or deletes a level, and those two
 * paths invalidate it explicitly.
 */

const API_BASE = buildApiUrl('/api/levels')

type LevelCatalogueResponse = {
  difficulty: Difficulty
  levelNumbers: number[]
}

const catalogueResource = createResource<Difficulty, number[]>({
  load: async (difficulty) => {
    const response = await requestOptionallyAuthenticatedJson<LevelCatalogueResponse>(
      `${API_BASE}/${difficulty}`,
    )

    // The server orders them, but the list is the thing every screen iterates, so it is worth being
    // certain rather than trusting the wire.
    return [...response.levelNumbers].sort((left, right) => left - right)
  },
  clone: (levelNumbers) => [...levelNumbers],
})

export async function getLevelCatalogue(difficulty: Difficulty) {
  return catalogueResource.get(difficulty)
}

export function invalidateLevelCatalogue(difficulty?: Difficulty) {
  catalogueResource.invalidate(difficulty)
}
