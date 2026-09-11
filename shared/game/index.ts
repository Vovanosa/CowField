export {
  areCellsTouching,
  getBullIndexes,
  getBullsPerGroupForDifficulty,
  getCellColumn,
  getCellRow,
  getGridSizeForDifficulty,
  getOrthogonalNeighbors,
  getPenCells,
  getPenIds,
  getRowPatterns,
  isConnectedRegion,
  type BullBoard,
  type Difficulty,
  type PenBoard,
} from './board'
export {
  solveBoard,
  type SolveOptions,
  type SolveResult,
} from './solver'
export {
  BOARD_VALIDATION_ISSUE_CODES,
  formatBoardValidationIssue,
  validateBoard,
  type BoardValidationIssue,
  type BoardValidationOptions,
  type BoardValidationResult,
  type ValidatableBoard,
} from './validation'
export {
  generateUniqueBoard,
  getVerificationNodeBudget,
  type GeneratedBoard,
  type GenerateBoardOptions,
} from './generator'
