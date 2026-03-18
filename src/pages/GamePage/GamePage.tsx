import { ArrowLeft, SquarePen, TimerReset } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { getColorForId } from '../../game/levels'
import { getLevelByDifficultyAndNumber } from '../../game/storage'
import { getBullsPerGroupForDifficulty } from '../../game/validation'
import type { Difficulty, LevelDefinition } from '../../game/types'
import './GamePage.css'

type CellMark = 'empty' | 'dot' | 'bull'
type DragMode = 'add-dot' | 'clear-dot' | null

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

function darkenHexColor(hexColor: string, amount: number) {
  const normalized = hexColor.replace('#', '')

  if (normalized.length !== 6) {
    return hexColor
  }

  const red = Math.max(0, Number.parseInt(normalized.slice(0, 2), 16) - amount)
  const green = Math.max(0, Number.parseInt(normalized.slice(2, 4), 16) - amount)
  const blue = Math.max(0, Number.parseInt(normalized.slice(4, 6), 16) - amount)

  return `rgb(${red} ${green} ${blue})`
}

function getSolutionState(level: LevelDefinition, marks: CellMark[], bullsPerGroup: number) {
  const bullIndexes = marks
    .map((mark, index) => ({ mark, index }))
    .filter((entry) => entry.mark === 'bull')
    .map((entry) => entry.index)

  const requiredBullCount = bullsPerGroup * level.gridSize
  const invalidBullIndexes = new Set<number>()
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
      rowCounts[row] > bullsPerGroup ||
      columnCounts[column] > bullsPerGroup ||
      (colorCounts.get(colorId) ?? 0) > bullsPerGroup
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
    isSolved: bullIndexes.length === requiredBullCount && invalidBullIndexes.size === 0,
  }
}

function getCellBorderStyle(level: LevelDefinition, cellIndex: number) {
  const { gridSize, pensByCell } = level
  const colorId = pensByCell[cellIndex]
  const row = Math.floor(cellIndex / gridSize)
  const column = cellIndex % gridSize
  const internalBorderColor = 'rgba(122, 57, 69, 0.82)'
  const sameColorGapColor = darkenHexColor(getColorForId(colorId), 12)

  const rightNeighbor = column < gridSize - 1 ? pensByCell[cellIndex + 1] : null
  const bottomNeighbor = row < gridSize - 1 ? pensByCell[cellIndex + gridSize] : null

  return {
    boxShadow: [
      rightNeighbor !== null && rightNeighbor !== colorId
        ? `2px 0 0 ${internalBorderColor}`
        : rightNeighbor !== null
          ? `2px 0 0 ${sameColorGapColor}`
        : null,
      bottomNeighbor !== null && bottomNeighbor !== colorId
        ? `0 2px 0 ${internalBorderColor}`
        : bottomNeighbor !== null
          ? `0 2px 0 ${sameColorGapColor}`
        : null,
    ]
      .filter(Boolean)
      .join(', '),
  }
}

function getCellStyle(level: LevelDefinition, cellIndex: number, isInvalid: boolean) {
  const borderStyle = getCellBorderStyle(level, cellIndex)

  return {
    backgroundColor: getColorForId(level.pensByCell[cellIndex]),
    boxShadow: [
      isInvalid ? 'inset 0 0 0 3px rgba(176, 75, 56, 0.42)' : null,
      isInvalid ? 'inset 0 0 0 999px rgba(255, 255, 255, 0.03)' : null,
      borderStyle.boxShadow || null,
    ]
      .filter(Boolean)
      .join(', '),
  }
}

export function GamePage() {
  const { difficulty, levelNumber } = useParams()
  const [level, setLevel] = useState<LevelDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cellMarks, setCellMarks] = useState<CellMark[]>([])
  const { isAdmin } = useRole()
  const dragStateRef = useRef<{
    isMouseDown: boolean
    startIndex: number | null
    startMark: CellMark | null
    dragMode: DragMode
    dragged: boolean
    visited: Set<number>
  }>({
    isMouseDown: false,
    startIndex: null,
    startMark: null,
    dragMode: null,
    dragged: false,
    visited: new Set<number>(),
  })

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

  useEffect(() => {
    function stopDragging() {
      dragStateRef.current = {
        isMouseDown: false,
        startIndex: null,
        startMark: null,
        dragMode: null,
        dragged: false,
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

  if (!isDifficulty(difficulty) || !levelNumber) {
    return (
      <div className="game-page">
        <p className="game-fallback-message">The requested level route is invalid.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="game-page">
        <p className="game-fallback-message">Loading level...</p>
      </div>
    )
  }

  if (!level) {
    return (
      <div className="game-page">
        <div className="game-topbar">
          <div className="game-topbar-left">
            <Link className="round-icon-link" to={`/levels/${difficulty}`} aria-label="Back to level list">
              <ArrowLeft size={16} />
            </Link>
            <p className="game-topbar-title">{`${difficulty} / ${levelNumber}`}</p>
          </div>
        </div>
        <div className="game-empty-state panel-surface">
          <p className="game-fallback-message">This level does not exist yet.</p>
          {isAdmin ? (
            <Link className="primary-button" to={`/levels/${difficulty}/create`}>
              <SquarePen size={18} />
              Create level
            </Link>
          ) : null}
        </div>
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
      currentMarks.map((mark, index, allMarks) => {
        if (index !== cellIndex) {
          return mark
        }

        if (mark === 'empty') {
          return 'dot'
        }

        if (mark === 'dot') {
          const currentBullCount = allMarks.filter((entry) => entry === 'bull').length

          if (currentBullCount >= requiredBullCount) {
            return 'empty'
          }

          return 'bull'
        }

        return 'empty'
      }),
    )
  }

  function applyDragMode(cellIndex: number, dragMode: Exclude<DragMode, null>) {
    setCellMarks((currentMarks) =>
      currentMarks.map((mark, index) => {
        if (index !== cellIndex || mark === 'bull') {
          return mark
        }

        return dragMode === 'add-dot' ? 'dot' : 'empty'
      }),
    )
  }

  function handleCellPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    cellIndex: number,
  ) {
    event.preventDefault()
    const startMark = cellMarks[cellIndex]

    dragStateRef.current = {
      isMouseDown: true,
      startIndex: cellIndex,
      startMark,
      dragMode:
        startMark === 'empty'
          ? 'add-dot'
          : startMark === 'dot'
            ? 'clear-dot'
            : null,
      dragged: false,
      visited: new Set<number>(),
    }
  }

  function handleCellPointerEnter(cellIndex: number) {
    const dragState = dragStateRef.current

    if (!dragState.isMouseDown || dragState.dragMode === null || dragState.startIndex === null) {
      return
    }

    if (!dragState.dragged) {
      dragState.dragged = true
      applyDragMode(dragState.startIndex, dragState.dragMode)
      dragState.visited.add(dragState.startIndex)
    }

    if (dragState.visited.has(cellIndex)) {
      return
    }

    dragState.visited.add(cellIndex)
    applyDragMode(cellIndex, dragState.dragMode)
  }

  function handleCellPointerUp(cellIndex: number) {
    const dragState = dragStateRef.current

    if (dragState.isMouseDown && !dragState.dragged && dragState.startIndex === cellIndex) {
      handleCellClick(cellIndex)
    }

    dragStateRef.current = {
      isMouseDown: false,
      startIndex: null,
      startMark: null,
      dragMode: null,
      dragged: false,
      visited: new Set<number>(),
    }
  }

  function handleResetBoard() {
    setCellMarks(
      Array.from({ length: currentLevel.gridSize * currentLevel.gridSize }, () => 'empty'),
    )
  }

  return (
    <div className="game-page">
      <div className="game-topbar">
        <div className="game-topbar-left">
          <Link className="round-icon-link" to={`/levels/${difficulty}`} aria-label="Back to level list">
            <ArrowLeft size={16} />
          </Link>
          <p className="game-topbar-title">{`${difficulty} / ${level.levelNumber}`}</p>
        </div>
        <button
          type="button"
          className="secondary-button game-topbar-reset"
          onClick={handleResetBoard}
        >
          <TimerReset size={18} />
          Reset
        </button>
      </div>

      <section className="game-layout">
        <div className="board-panel panel-surface">
          <div className="board-panel-header">
            <div className="board-stat board-stat-compact">
              <p className="board-panel-label">Remaining bulls</p>
              <strong className="board-panel-value">{remainingBulls}</strong>
            </div>
            <div className="board-stat board-stat-status">
              <p className="board-panel-label">Status</p>
              <p className={isSolved ? 'game-status game-status-solved' : 'game-status'}>
                {isSolved
                  ? 'Level solved.'
                  : invalidBullIndexes.size > 0
                    ? 'Some bulls break the rules.'
                    : 'Tap a cell to place notes and bulls.'}
              </p>
            </div>
            {isAdmin ? (
              <div className="board-toolbar">
                <Link
                  className="secondary-button"
                  to={`/levels/${difficulty}/${level.levelNumber}/edit`}
                >
                  <SquarePen size={18} />
                  Edit level
                </Link>
              </div>
            ) : null}
          </div>

          <div className="board-preview" aria-label="Puzzle board">
            <div
              className="board-preview-grid"
              style={{ gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))` }}
            >
              {level.pensByCell.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={
                    invalidBullIndexes.has(index)
                      ? 'board-cell board-cell-invalid'
                      : 'board-cell'
                  }
                  style={getCellStyle(level, index, invalidBullIndexes.has(index))}
                  onPointerDown={(event) => handleCellPointerDown(event, index)}
                  onPointerEnter={() => handleCellPointerEnter(index)}
                  onPointerUp={() => handleCellPointerUp(index)}
                  onDragStart={(event) => event.preventDefault()}
                >
                  {cellMarks[index] === 'dot' ? <span className="board-cell-dot" /> : null}
                  {cellMarks[index] === 'bull' ? <CowMarker /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
