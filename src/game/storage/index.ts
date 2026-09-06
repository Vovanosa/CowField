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
  getPlayerSettings,
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
  getDifficultyLevelsPageData,
  getDifficultyOverview,
  getLevelProgress,
  getPlayerStatistics,
  getProgressByDifficulty,
  recordBullPlacements,
  resetPlayerCaches,
  type DifficultyLevelsPageData,
} from './resources'
