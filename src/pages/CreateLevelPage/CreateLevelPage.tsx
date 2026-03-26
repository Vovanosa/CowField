import { ArrowLeft, BadgeCheck, RefreshCw, Save, SquarePen, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { generateLevelDraft, getColorForId } from '../../game/levels'
import {
  createEmptyLevelDraft,
  deleteLevel,
  getLevelByDifficultyAndNumber,
  getLevelsByDifficulty,
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
type ToastState = {
  variant: 'success' | 'warning'
  title: string
  details?: string[]
}

type DeleteDialogState = {
  difficulty: Difficulty
  levelNumber: number
} | null

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
  const { t } = useTranslation()
  const { isAdmin } = useRole()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<LevelDraft | null>(null)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [activeTool, setActiveTool] = useState<ActiveTool>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null)
  const dragStateRef = useRef<{
    isPointerDown: boolean
    visited: Set<number>
  }>({
    isPointerDown: false,
    visited: new Set<number>(),
  })

  useEffect(() => {
    let isActive = true

    async function loadPageData() {
      try {
        if (routeLevelNumber) {
          const existingLevel = await getLevelByDifficultyAndNumber(difficulty, routeLevelNumber, {
            includeAuthoringData: true,
          })

          if (!isActive) {
            return
          }

          setDraft(
            existingLevel ?? createEmptyLevelDraft(difficulty, routeLevelNumber),
          )
        } else {
          const levels = await getLevelsByDifficulty(difficulty)
          const nextLevelNumber =
            levels.length > 0
              ? Math.max(...levels.map((level) => level.levelNumber)) + 1
              : 1

          if (!isActive) {
            return
          }

          setDraft(createEmptyLevelDraft(difficulty, nextLevelNumber))
        }

        setLoadError('')
        setToast(null)
        setActiveTool(1)
      } catch (error) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error ? error.message : t('Failed to load level data.'),
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
  }, [difficulty, routeLevelNumber, t])

  useEffect(() => {
    function stopDragging() {
      dragStateRef.current = {
        isPointerDown: false,
        visited: new Set<number>(),
      }
    }

    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 4500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toast])

  if (!draft) {
    return (
      <div className="create-level-page">
        <p className="status-message">
          {isLoading ? t('Loading level...') : loadError}
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="create-level-page">
        <p className="status-message">
          {t('Admin role is required to create or edit levels.')}
        </p>
        <Link className="secondary-button" to="/levels">
          {t('Back to levels')}
        </Link>
      </div>
    )
  }

  const currentDraft = draft
  const colorOptions = Array.from({ length: currentDraft.gridSize }, (_, index) => index + 1)
  const requiredCowCount =
    currentDraft.gridSize * getBullsPerGroupForDifficulty(currentDraft.difficulty)

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

  function handleCellPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    event.preventDefault()
    dragStateRef.current = {
      isPointerDown: true,
      visited: new Set([cellIndex]),
    }
    handleCellPaint(cellIndex)
  }

  function handleCellPointerEnter(cellIndex: number) {
    const dragState = dragStateRef.current

    if (!dragState.isPointerDown || dragState.visited.has(cellIndex)) {
      return
    }

    dragState.visited.add(cellIndex)
    handleCellPaint(cellIndex)
  }

  function handleCellPointerUp() {
    dragStateRef.current = {
      isPointerDown: false,
      visited: new Set<number>(),
    }
  }

  async function handleSave() {
    const nextDraft = currentDraft satisfies LevelDraft
    const validationResult = validateLevelDraft(nextDraft)

    if (!validationResult.isValid) {
      setToast({
        variant: 'warning',
        title: t('Fix those problems and try again.'),
        details: validationResult.issues,
      })
      return
    }

    try {
      await saveLevel(nextDraft)
      setDraft(nextDraft)
      setToast({
        variant: 'success',
        title: t('Level saved'),
      })
    } catch (error) {
      setToast({
        variant: 'warning',
        title: error instanceof Error ? error.message : t('Failed to save level.'),
      })
    }
  }

  async function handleDelete() {
    if (!deleteDialog || isDeleting) {
      return
    }

    setIsDeleting(true)
    setToast(null)

    try {
      await deleteLevel(deleteDialog.difficulty, deleteDialog.levelNumber)
      setDeleteDialog(null)
      void navigate(`/levels/${deleteDialog.difficulty}`)
    } catch (error) {
      setToast({
        variant: 'warning',
        title: error instanceof Error ? error.message : t('Failed to delete level.'),
      })
      setIsDeleting(false)
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
    setToast({
      variant: 'success',
      title: t('Board cleared'),
    })
  }

  function handleValidate() {
    const validationResult = validateLevelDraft(currentDraft)

    if (validationResult.isValid) {
      setToast({
        variant: 'success',
        title: t('Validation passed'),
      })
      return
    }

    setToast({
      variant: 'warning',
      title: t('Fix those problems and try again.'),
      details: validationResult.issues,
    })
  }

  function handleGenerate() {
    setToast(null)

    const generatedDraft = generateLevelDraft(
      currentDraft.levelNumber,
      t('Level {{levelNumber}}', { levelNumber: currentDraft.levelNumber }),
      currentDraft.difficulty,
    )

    if (!generatedDraft) {
      setToast({
        variant: 'warning',
        title: t('Switch to light, easy, or medium to use automatic generation.'),
        details: [
          t('Automatic generation is currently implemented for light, easy, and medium only.'),
          t('The generator builds a full draft by placing one legal cow in each row and column, then growing connected color regions around those seed cells.'),
          t('If a generated draft does not pass the validator, the generator retries automatically until it finds a legal result or gives up.'),
        ],
      })
      return
    }

    setDraft(generatedDraft)
    setToast({
      variant: 'success',
      title: t('Level generated'),
    })
  }

  return (
    <div className="create-level-page">
      {toast ? (
        <div
          className={
            toast.variant === 'success'
              ? 'editor-toast editor-toast-success'
              : 'editor-toast editor-toast-warning'
          }
          role="status"
          aria-live="polite"
        >
          <p className="editor-toast-title">{toast.title}</p>
          {toast.details?.length ? (
            <ul className="editor-toast-list">
              {toast.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {deleteDialog ? (
        <div className="editor-dialog-backdrop" role="presentation">
          <div
            className="editor-dialog panel-surface"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-level-title"
            aria-describedby="delete-level-description"
          >
            <h3 id="delete-level-title">{t('Delete level?')}</h3>
            <p id="delete-level-description">
              {t('Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.', {
                difficulty: getDifficultyLabel(t, difficulty),
                levelNumber: deleteDialog.levelNumber,
              })}
            </p>
            <div className="editor-dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteDialog(null)}
                disabled={isDeleting}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                className="secondary-button danger-button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                <Trash2 size={18} />
                {isDeleting ? t('Deleting...') : t('Delete level')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Link
        className="round-icon-link"
        to={`/levels/${difficulty}`}
        aria-label={t('Back to levels')}
      >
        <ArrowLeft size={16} />
      </Link>

      <section className="create-level-layout create-level-layout-single">
        <div className="editor-panel panel-surface">
          <div className="editor-heading">
            <SquarePen size={18} />
            <h2>{t('Create/Edit Level')}</h2>
          </div>

          <div className="editor-section">
            <div className="editor-actions">
              <div className="editor-actions-group">
                <button type="button" className="secondary-button" onClick={handleGenerate}>
                  <RefreshCw size={18} />
                  {t('Generate')}
                </button>
                <button type="button" className="secondary-button" onClick={handleValidate}>
                  <BadgeCheck size={18} />
                  {t('Validate level')}
                </button>
                <button type="button" className="primary-button" onClick={handleSave}>
                  <Save size={18} />
                  {t('Save level')}
                </button>
              </div>

              <div className="editor-actions-group editor-actions-group-right">
                <button type="button" className="secondary-button" onClick={handleClearBoard}>
                  {t('Clear board')}
                </button>
                {routeLevelNumber ? (
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    onClick={() =>
                      setDeleteDialog({
                        difficulty,
                        levelNumber: routeLevelNumber,
                      })
                    }
                    disabled={isDeleting}
                  >
                    <Trash2 size={18} />
                    {t('Delete level')}
                  </button>
                ) : null}
              </div>
            </div>

            <p className="section-copy">
              {t('Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.', {
                gridSize: currentDraft.gridSize,
                requiredCowCount,
              })}
            </p>

            <div className="pen-palette" aria-label={t('Color palette')}>
              <button
                type="button"
                className={activeTool === 0 ? 'pen-chip pen-chip-active' : 'pen-chip'}
                onClick={() => setActiveTool(0)}
              >
                {t('Erase')}
              </button>
              <button
                type="button"
                className={
                  activeTool === cowTool ? 'pen-chip pen-chip-active' : 'pen-chip'
                }
                onClick={() => setActiveTool(cowTool)}
              >
                {t('Cow')}
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
                  {t('Color {{colorId}}', { colorId })}
                </button>
              ))}
            </div>

            <div className="editor-board" aria-label={t('Level color editor')}>
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
                    onPointerDown={(event) => handleCellPointerDown(event, cellIndex)}
                    onPointerEnter={() => handleCellPointerEnter(cellIndex)}
                    onPointerUp={handleCellPointerUp}
                    onDragStart={(event) => event.preventDefault()}
                  >
                    {colorId === 0 ? '' : <span className="editor-cell-label">{colorId}</span>}
                    {currentDraft.cowsByCell[cellIndex] ? <CowMarker /> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export function CreateLevelPage() {
  const { difficulty, levelNumber } = useParams()
  const { t } = useTranslation()

  if (!isDifficulty(difficulty)) {
    return <div className="create-level-page"><p className="status-message">{t('Unknown difficulty.')}</p></div>
  }

  return (
    <CreateLevelPageView
      key={`${difficulty}-${levelNumber ?? 'create'}`}
      difficulty={difficulty}
      levelNumber={levelNumber ? Number(levelNumber) : undefined}
    />
  )
}
