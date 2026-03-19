export {
  createEmptyLevelDraft,
  deleteLevel,
  DIFFICULTIES,
  getLevelByDifficultyAndNumber,
  getLevelsByDifficulty,
  getNextLevelNumber,
  saveLevel,
} from './levelStorage'
export { getContentByKey, saveContentByKey, type AppContentKey } from './contentStorage'
export { completeLevelProgress, getLevelProgress, getProgressByDifficulty } from './progressStorage'
export { getPlayerStatistics, recordBullPlacement } from './statisticsStorage'
