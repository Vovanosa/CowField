import { ArrowLeft, RotateCcw, SquarePen, TimerReset, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { PageIntro } from '../../components/PageIntro'
import { getColorForId } from '../../game/levels'
import { getLevelByDifficultyAndNumber } from '../../game/storage'
import { getBullsPerGroupForDifficulty } from '../../game/validation'
import type { Difficulty, LevelDefinition } from '../../game/types'
import './GamePage.css'

type CellMark = 'empty' | 'dot' | 'bull'

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

function CowMarker() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="play-cow-marker"
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

function getSolutionState(level: LevelDefinition, marks: CellMark[], bullsPerGroup: number) {
  const bullIndexes = marks
    .map((mark, index) => ({ mark, index }))
    .filter((entry) => entry.mark === 'bull')
    .map((entry) => entry.index)

  const requiredBullCount = bullsPerGroup * level.gridSize
  const invalidBullIndexes = new Set<number>()

  if (bullIndexes.length !== requiredBullCount) {
    return {
      requiredBullCount,
      bullIndexes,
      invalidBullIndexes,
      isSolved: false,
    }
  }

  const rowCounts = Array.from({ length: level.gridSize }, () => 0)
  const columnCounts = Array.from({ length: level.gridSize }, () => 0)
  const colorCounts = new Map<number, number>()
  const bullSet = new Set(bullIndexes)

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    rowCounts[row] += 1
    columnCounts[column] += 1
    colorCounts.set(colorId, (colorCounts.get(colorId) ?? 0) + 1)
  }

  for (const bullIndex of bullIndexes) {
    const row = Math.floor(bullIndex / level.gridSize)
    const column = bullIndex % level.gridSize
    const colorId = level.pensByCell[bullIndex]

    if (
      rowCounts[row] !== bullsPerGroup ||
      columnCounts[column] !== bullsPerGroup ||
      (colorCounts.get(colorId) ?? 0) !== bullsPerGroup
    ) {
      invalidBullIndexes.add(bullIndex)
    }

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue
        }

        const nextRow = row + rowOffset
        const nextColumn = column + columnOffset

        if (
          nextRow < 0 ||
          nextRow >= level.gridSize ||
          nextColumn < 0 ||
          nextColumn >= level.gridSize
        ) {
          continue
        }

        const neighborIndex = nextRow * level.gridSize + nextColumn

        if (bullSet.has(neighborIndex)) {
          invalidBullIndexes.add(bullIndex)
          invalidBullIndexes.add(neighborIndex)
        }
      }
    }
  }

  return {
    requiredBullCount,
    bullIndexes,
    invalidBullIndexes,
    isSolved: invalidBullIndexes.size === 0,
  }
}

export function GamePage() {
  const { difficulty, levelNumber } = useParams()
  const [level, setLevel] = useState<LevelDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cellMarks, setCellMarks] = useState<CellMark[]>([])
  const { isAdmin } = useRole()

  useEffect(() => {
    if (!isDifficulty(difficulty) || !levelNumber) {
      return
    }

    const difficultyKey = difficulty
    let isActive = true

    async function loadLevel() {
      const nextLevel = await getLevelByDifficultyAndNumber(
        difficultyKey,
        Number(levelNumber),
      )

      if (!isActive) {
        return
      }

      setLevel(nextLevel)
      setCellMarks(
        nextLevel
          ? Array.from({ length: nextLevel.gridSize * nextLevel.gridSize }, () => 'empty')
          : [],
      )
      setIsLoading(false)
    }

    void loadLevel()

    return () => {
      isActive = false
    }
  }, [difficulty, levelNumber])

  if (!isDifficulty(difficulty) || !levelNumber) {
    return (
      <div className="game-page">
        <PageIntro title="Unknown level." description="The requested level route is invalid." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="game-page">
        <PageIntro
          eyebrow={`${difficulty} / ${levelNumber}`}
          title="Loading level..."
          description="Fetching the level data from the project API."
        />
      </div>
    )
  }

  if (!level) {
    return (
      <div className="game-page">
        <PageIntro
          eyebrow={`${difficulty} / ${levelNumber}`}
          title="This level does not exist yet."
          description="Create it first, then come back here to inspect the board data."
          actions={isAdmin ? (
            <Link className="primary-button" to={`/levels/${difficulty}/create`}>
              <SquarePen size={18} />
              Create level
            </Link>
          ) : undefined}
        />
      </div>
    )
  }

  const currentLevel = level
  const bullsPerGroup = getBullsPerGroupForDifficulty(currentLevel.difficulty)
  const { requiredBullCount, bullIndexes, invalidBullIndexes, isSolved } = getSolutionState(
    currentLevel,
    cellMarks,
    bullsPerGroup,
  )
  const remainingBulls = Math.max(requiredBullCount - bullIndexes.length, 0)

  function handleCellClick(cellIndex: number) {
    setCellMarks((currentMarks) =>
      currentMarks.map((mark, index) => {
        if (index !== cellIndex) {
          return mark
        }

        if (mark === 'empty') {
          return 'dot'
        }

        if (mark === 'dot') {
          return 'bull'
        }

        return 'empty'
      }),
    )
  }

  function handleResetBoard() {
    setCellMarks(
      Array.from({ length: currentLevel.gridSize * currentLevel.gridSize }, () => 'empty'),
    )
  }

  function handleClearNotes() {
    setCellMarks((currentMarks) =>
      currentMarks.map((mark) => (mark === 'dot' ? 'empty' : mark)),
    )
  }

  return (
    <div className="game-page">
      <Link className="game-back-link" to={`/levels/${difficulty}`} aria-label="Back to level list">
        <ArrowLeft size={16} />
      </Link>

      <PageIntro
        eyebrow={`${difficulty} / ${level.levelNumber}`}
        title={level.title}
        description="Place bulls so each row, column, and color hits the target while no bulls touch, even diagonally."
      />

      <section className="game-layout">
        <div className="board-panel">
          <div className="board-panel-header">
            <div>
              <p className="board-panel-label">Remaining bulls</p>
              <strong className="board-panel-value">{remainingBulls}</strong>
            </div>
            <div>
              <p className="board-panel-label">Difficulty</p>
              <strong className="board-panel-value board-panel-value-small">
                {level.difficulty}
              </strong>
            </div>
          </div>

          <div className="board-preview" aria-label="Puzzle board">
            <div
              className="board-preview-grid"
              style={{ gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))` }}
            >
              {level.pensByCell.map((colorId, index) => (
                <button
                  key={index}
                  type="button"
                  className={
                    invalidBullIndexes.has(index)
                      ? 'board-cell board-cell-invalid'
                      : 'board-cell'
                  }
                  style={{ backgroundColor: getColorForId(colorId) }}
                  onClick={() => handleCellClick(index)}
                >
                  {cellMarks[index] === 'dot' ? <span className="board-cell-dot" /> : null}
                  {cellMarks[index] === 'bull' ? <CowMarker /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="control-panel">
          <div className="control-group">
            <h2>{isAdmin ? 'Level data' : 'Puzzle status'}</h2>
            {isAdmin ? (
              <>
                <p>
                  Grid size: <strong>{level.gridSize} x {level.gridSize}</strong>
                </p>
                <p>
                  Rule target: <strong>{bullsPerGroup}</strong> bull
                  {bullsPerGroup > 1 ? 's' : ''} per color, row, and column.
                </p>
              </>
            ) : null}
            <p>
              Placed bulls: <strong>{bullIndexes.length}</strong> / {requiredBullCount}
            </p>
            <p className={isSolved ? 'game-status game-status-solved' : 'game-status'}>
              {isSolved
                ? 'Level solved.'
                : bullIndexes.length === requiredBullCount && invalidBullIndexes.size > 0
                  ? 'Some bulls break the rules.'
                  : 'Tap a cell to place notes and bulls.'}
            </p>
          </div>

          <div className="control-actions">
            {isAdmin ? (
              <button type="button" className="secondary-button" disabled>
                <RotateCcw size={18} />
                Undo later
              </button>
            ) : null}
            <button
              type="button"
              className="secondary-button"
              onClick={handleResetBoard}
            >
              <TimerReset size={18} />
              Reset board
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleClearNotes}
            >
              <Trash2 size={18} />
              Clear notes
            </button>
            {isAdmin ? (
              <Link
                className="secondary-button"
                to={`/levels/${difficulty}/${level.levelNumber}/edit`}
              >
                <SquarePen size={18} />
                Edit level
              </Link>
            ) : null}
          </div>
        </aside>
      </section>
    </div>
  )
}
