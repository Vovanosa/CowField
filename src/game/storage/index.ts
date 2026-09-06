export {
  createEmptyLevelDraft,
  deleteLevel,
  DIFFICULTIES,
  getLevelByDifficultyAndNumber,
  getLevelsByDifficulty,
  saveLevel,
} from './levelStorage'
export {
  clearMoveHistory,
  getMoveHistoryCount,
  popMoveHistoryEntry,
  pushMoveHistoryEntry,
} from './moveHistoryStorage'
export {
  applyThemeMode,
  getDefaultPlayerSettings,
  getPlayerSettingsSnapshot,
  savePlayerSettings,
  subscribeToPlayerSettings,
} from './playerSettingsStorage'
export {
  buildAuthenticatedHeaders,
  clearStoredSessionToken,
  completeGoogleLogin,
  getCurrentSession,
  getStoredSessionToken,
  login,
  loginWithGoogle,
  loginAsGuest,
  logout,
  register,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  setStoredSessionToken,
} from './authSessionStorage'
export {
  completeLevelProgress,
  getBestTime,
  getBestTimes,
  getDifficultyLevelsPageData,
  getDifficultyOverview,
  getPlayerStatistics,
  recordBullPlacements,
  resetPlayerCaches,
  type DifficultyLevelsPageData,
} from './resources'
