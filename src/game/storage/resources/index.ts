import { invalidateDifficultyOverviewCache } from './difficultyOverview'
import { invalidateLevelBoards } from './levelBoard'
import { invalidateLevelCatalogue } from './levelCatalogue'
import { invalidateProgress } from './progress'
import { invalidatePlayerStatisticsCache } from './statistics'

export {
  getDifficultyOverview,
  invalidateDifficultyOverviewCache,
  patchDifficultyCompletedCount,
  type DifficultyOverviewResponse,
} from './difficultyOverview'
export {
  getLevelBoard,
  invalidateLevelBoards,
  setLevelBoard,
  type LevelDetailApiRecord,
} from './levelBoard'
export { getLevelCatalogue, invalidateLevelCatalogue } from './levelCatalogue'
export {
  getDifficultyLevelsPageData,
  type DifficultyLevelsPageData,
} from './levelsView'
export {
  completeLevelProgress,
  getBestTime,
  getBestTimes,
  importGuestProgressIntoAccount,
  invalidateProgress,
  peekBestTime,
  type CompleteLevelResult,
} from './progress'
export {
  getPlayerStatistics,
  invalidatePlayerStatisticsCache,
  recordBullPlacements,
} from './statistics'

/**
 * Drops **everything** that belongs to the signed-in player.
 *
 * One function rather than a list each caller has to remember. Every cache here is per-player:
 * progress and statistics obviously so, but the level catalogue and boards too, because the server
 * strips `cowsByCell` for non-admins — so an admin signing out and a player signing in must not
 * inherit each other's boards.
 *
 * Called on sign-in, registration, guest entry and sign-out. Adding a resource means adding it here,
 * and nowhere else.
 */
export function resetPlayerCaches() {
  invalidateProgress()
  invalidateDifficultyOverviewCache()
  invalidatePlayerStatisticsCache()
  invalidateLevelCatalogue()
  invalidateLevelBoards()
}
