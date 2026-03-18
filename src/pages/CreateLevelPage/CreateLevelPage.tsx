import { PencilRuler, RefreshCw, Save, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { generateLevelDraft, getColorForId } from '../../game/levels'
import {
  createEmptyLevelDraft,
  getLevelByDifficultyAndNumber,
  getNextLevelNumber,
  saveLevel,
} from '../../game/storage'
import {
  getBullsPerGroupForDifficulty,
  validateLevelDraft,
} from '../../game/validation'
import type { Difficulty, LevelDraft } from '../../game/types'
import './CreateLevelPage.css'

const cowTool = 'cow' as const
type ActiveTool = number | typeof cowTool

function CowMarker() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="cow-marker"
      focusable="false"
    >
      <path
        d="M8 10 5.5 5.8l5 2.4L12.6 7h6.8l2.1 1.2 5-2.4L24 10v8.2A4.8 4.8 0 0 1 19.2 23H12.8A4.8 4.8 0 0 1 8 18.2Z"
        fill="#fffaf4"
        stroke="#7e4f47"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12.2" cy="15.2" r="1" fill="#7e4f47" />
      <circle cx="19.8" cy="15.2" r="1" fill="#7e4f47" />
      <path
        d="M12.2 18.4h7.6a2.8 2.8 0 0 1-2.8 3h-2a2.8 2.8 0 0 1-2.8-3Z"
        fill="#e9b0bb"
        stroke="#7e4f47"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="14.4" cy="19.7" r="0.6" fill="#7e4f47" />
      <circle cx="17.6" cy="19.7" r="0.6" fill="#7e4f47" />
    </svg>
  )
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

type CreateLevelPageViewProps = {
  difficulty: Difficulty
  levelNumber?: number
}

function CreateLevelPageView({
  difficulty,
  levelNumber: routeLevelNumber,
}: CreateLevelPageViewProps) {
  const { isAdmin } = useRole()
  const [draft, setDraft] = useState<LevelDraft | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [validationIssues, setValidationIssues] = useState<string[]>([])
  const [activeTool, setActiveTool] = useState<ActiveTool>(1)
  const [isLoading, setIsLoading] = useState(true)

  const bullsPerGroup = getBullsPerGroupForDifficulty(difficulty)

  useEffect(() => {
    let isActive = true

    async function loadPageData() {
      try {
        if (routeLevelNumber) {
          const existingLevel = await getLevelByDifficultyAndNumber(difficulty, routeLevelNumber)

          if (!isActive) {
            return
          }

          setDraft(
            existingLevel ?? createEmptyLevelDraft(difficulty, routeLevelNumber),
          )
        } else {
          const nextLevelNumber = await getNextLevelNumber(difficulty)

          if (!isActive) {
            return
          }

          setDraft(createEmptyLevelDraft(difficulty, nextLevelNumber))
        }

        setValidationIssues([])
        setStatusMessage('')
        setActiveTool(1)
      } catch (error) {
        if (!isActive) {
          return
        }

        setStatusMessage(
          error instanceof Error ? error.message : 'Failed to load level data.',
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadPageData()

    return () => {
      isActive = false
    }
  }, [difficulty, routeLevelNumber])

  if (!draft) {
    return (
      <div className="create-level-page">
        <p className="status-message">
          {isLoading ? 'Loading level data...' : statusMessage}
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="create-level-page">
        <p className="status-message">
          Admin role is required to create or edit levels.
        </p>
        <Link className="secondary-button" to="/levels">
          Back to levels
        </Link>
      </div>
    )
  }

  const currentDraft = draft
  const colorOptions = Array.from({ length: currentDraft.gridSize }, (_, index) => index + 1)
  const unassignedCells = currentDraft.pensByCell.filter((colorId) => colorId === 0).length

  function handleCellPaint(cellIndex: number) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      const nextColors = [...currentDraft.pensByCell]
      const nextCows = [...currentDraft.cowsByCell]

      if (activeTool === cowTool) {
        nextCows[cellIndex] = !nextCows[cellIndex]
      } else if (activeTool === 0) {
        nextColors[cellIndex] = 0
        nextCows[cellIndex] = false
      } else {
        nextColors[cellIndex] = activeTool
      }

      return {
        ...currentDraft,
        pensByCell: nextColors,
        cowsByCell: nextCows,
      }
    })
  }

  async function handleSave() {
    const nextDraft = currentDraft satisfies LevelDraft
    const validationResult = validateLevelDraft(nextDraft)
    setValidationIssues(validationResult.issues)

    if (!validationResult.isValid) {
      setStatusMessage('Level validation failed. Fix the issues before saving.')
      return
    }

    try {
      await saveLevel(nextDraft)
      setDraft(nextDraft)
      setStatusMessage(
        `Saved ${difficulty} level ${currentDraft.levelNumber}. The validator found at least one valid solution.`,
      )
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save level.',
      )
    }
  }

  function handleClearBoard() {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        pensByCell: Array.from({ length: currentDraft.gridSize * currentDraft.gridSize }, () => 0),
        cowsByCell: Array.from({ length: currentDraft.gridSize * currentDraft.gridSize }, () => false),
      }
    })
    setValidationIssues([])
    setStatusMessage('Cleared colors and cows for the current draft.')
  }

  function handleValidate() {
    const validationResult = validateLevelDraft(currentDraft)
    setValidationIssues(validationResult.issues)

    if (validationResult.isValid) {
      setStatusMessage(
        'Validation passed. The level currently has at least one valid solution.',
      )
      return
    }

    setStatusMessage('Validation found issues. Review them before saving.')
  }

  function handleGenerate() {
    setValidationIssues([])
    setStatusMessage('')

    const generatedDraft = generateLevelDraft(
      currentDraft.levelNumber,
      `Level ${currentDraft.levelNumber}`,
      currentDraft.difficulty,
    )

    if (!generatedDraft) {
      setValidationIssues([
        'Automatic generation is currently implemented for light, easy, and medium only.',
        'Generation places one legal cow in each row and column, with no neighboring cows, then assigns one unique color to each generated cow cell.',
        'After that, you can finish the rest of the color regions manually.',
      ])
      setStatusMessage('Switch to light, easy, or medium to use automatic generation.')
      return
    }

    setDraft(generatedDraft)
    setStatusMessage(
      `Generated ${generatedDraft.gridSize} legal cow seed cells with ${generatedDraft.gridSize} unique colors. Finish the remaining color regions manually.`,
    )
  }

  return (
    <div className="create-level-page">
      <section className="create-level-layout create-level-layout-single">
        <div className="editor-panel">
          <div className="editor-section">
            <div className="editor-heading">
              <SquarePen size={18} />
              <h2>Create Level</h2>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  value={currentDraft.title}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            title: event.target.value,
                          }
                        : current,
                    )
                  }
                  placeholder={`Level ${draft.levelNumber}`}
                />
              </label>

              <label className="field">
                <span>Difficulty</span>
                <input
                  type="text"
                  value={difficulty}
                  disabled
                  readOnly
                />
              </label>

              <label className="field">
                <span>Level</span>
                <input
                  type="text"
                  value={`Level ${draft.levelNumber}`}
                  disabled
                  readOnly
                />
              </label>
            </div>

            <div className="slot-status">
              <p className="rule-summary">
                {difficulty === 'light'
                  ? 'Light: 1 cow per row, column, and color on a 6 x 6 board.'
                  : difficulty === 'easy'
                  ? 'Easy: 1 cow per row, column, and color on an 8 x 8 board.'
                    : difficulty === 'medium'
                      ? 'Medium: 1 cow per row, column, and color on a 10 x 10 board.'
                      : 'Hard: 2 cows per row, column, and color on a 10 x 10 board.'}
              </p>
            </div>
          </div>

          <div className="editor-section">
            <div className="editor-heading">
              <PencilRuler size={18} />
              <h2>Color Painter</h2>
            </div>

            <p className="section-copy">
              Pick a color, then click cells to assign them to that region. Every
              cell must belong to some color before the level can be saved. This
              board needs exactly {currentDraft.gridSize} connected colors.
            </p>

            <div className="pen-palette" aria-label="Color palette">
              <button
                type="button"
                className={activeTool === 0 ? 'pen-chip pen-chip-active' : 'pen-chip'}
                onClick={() => setActiveTool(0)}
              >
                Erase
              </button>
              <button
                type="button"
                className={
                  activeTool === cowTool ? 'pen-chip pen-chip-active' : 'pen-chip'
                }
                onClick={() => setActiveTool(cowTool)}
              >
                Cow
              </button>
              {colorOptions.map((colorId) => (
                <button
                  key={colorId}
                  type="button"
                  className={
                    activeTool === colorId ? 'pen-chip pen-chip-active' : 'pen-chip'
                  }
                  style={{ backgroundColor: getColorForId(colorId) }}
                  onClick={() => setActiveTool(colorId)}
                >
                  Color {colorId}
                </button>
              ))}
            </div>

            <div className="editor-board" aria-label="Level color editor">
              <div
                className="editor-board-grid"
                style={{
                  gridTemplateColumns: `repeat(${currentDraft.gridSize}, minmax(0, 1fr))`,
                }}
              >
                {currentDraft.pensByCell.map((colorId, cellIndex) => (
                  <button
                    key={cellIndex}
                    type="button"
                    className={colorId === 0 ? 'editor-cell editor-cell-empty' : 'editor-cell'}
                    style={{ backgroundColor: getColorForId(colorId) }}
                    onClick={() => handleCellPaint(cellIndex)}
                  >
                    {colorId === 0 ? '' : <span className="editor-cell-label">{colorId}</span>}
                    {currentDraft.cowsByCell[cellIndex] ? <CowMarker /> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-footer">
              <p>
                Grid size: {currentDraft.gridSize} x {currentDraft.gridSize}. Unassigned cells:{' '}
                {unassignedCells}. Rule target: {bullsPerGroup} cow
                {bullsPerGroup > 1 ? 's' : ''} per row, column, and color.
              </p>
            </div>

            <div className="editor-actions">
              <button type="button" className="secondary-button" onClick={handleGenerate}>
                <RefreshCw size={18} />
                Generate
              </button>
              <button type="button" className="secondary-button" onClick={handleValidate}>
                Validate level
              </button>
              <button type="button" className="primary-button" onClick={handleSave}>
                <Save size={18} />
                Save level
              </button>
              <button type="button" className="secondary-button" onClick={handleClearBoard}>
                Clear board
              </button>
              <Link className="secondary-button" to={`/levels/${difficulty}`}>
                Back to levels
              </Link>
            </div>
          </div>

          <div className="editor-section">
            <div className="editor-heading">
              <Save size={18} />
              <h2>Validator</h2>
            </div>
            <p className="section-copy">
              Save is blocked unless the board structure is valid and the solver
              finds at least one solution for the selected difficulty.
            </p>
            {validationIssues.length > 0 ? (
              <ul className="validation-list">
                {validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="validation-ok">
                Run validation after editing the board to confirm the level is legal.
              </p>
            )}
          </div>

          {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
        </div>
      </section>
    </div>
  )
}

export function CreateLevelPage() {
  const { difficulty, levelNumber } = useParams()

  if (!isDifficulty(difficulty)) {
    return <div className="create-level-page"><p className="status-message">Unknown difficulty.</p></div>
  }

  return (
    <CreateLevelPageView
      key={`${difficulty}-${levelNumber ?? 'create'}`}
      difficulty={difficulty}
      levelNumber={levelNumber ? Number(levelNumber) : undefined}
    />
  )
}
