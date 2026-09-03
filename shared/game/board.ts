/**
 * The puzzle's board rules, shared by the web app and the API.
 *
 * `shared/game/` is the ONE copy of these rules. Both `src/game/` and `server/src/` import it, so a
 * rule change lands in both runtimes at once — previously the rules were hand-maintained twice and
 * had already diverged.
 *
 * Keep this folder free of DOM, Node and env access: it is bundled by Vite for the browser and run
 * directly by tsx on the server.
 */

export type Difficulty = 'light' | 'easy' | 'medium' | 'hard'

/**
 * A board's pen assignment: one pen id per cell, row-major. `0` means "not in a pen yet", which is
 * what a freshly cleared editor board looks like.
 */
export type PenBoard = {
  gridSize: number
  pensByCell: number[]
}

/** A pen board plus its authored bull layout — a complete level draft. */
export type BullBoard = PenBoard & {
  bullsByCell: boolean[]
}

export function getGridSizeForDifficulty(difficulty: Difficulty) {
  switch (difficulty) {
    case 'light':
      return 6
    case 'easy':
      return 8
    case 'medium':
    case 'hard':
      return 10
    default:
      return 10
  }
}

/** How many bulls each row, column and pen must hold. `hard` is the only two-bull difficulty. */
export function getBullsPerGroupForDifficulty(difficulty: Difficulty) {
  return difficulty === 'hard' ? 2 : 1
}

export function getCellRow(cellIndex: number, gridSize: number) {
  return Math.floor(cellIndex / gridSize)
}

export function getCellColumn(cellIndex: number, gridSize: number) {
  return cellIndex % gridSize
}

/** Bulls may not touch, so "adjacent" always means all eight directions. */
export function areCellsTouching(left: number, right: number, gridSize: number) {
  return (
    Math.abs(getCellRow(left, gridSize) - getCellRow(right, gridSize)) <= 1 &&
    Math.abs(getCellColumn(left, gridSize) - getCellColumn(right, gridSize)) <= 1
  )
}

/** Pens are connected orthogonally — diagonal contact does not join a pen. */
export function getOrthogonalNeighbors(cellIndex: number, gridSize: number) {
  const row = getCellRow(cellIndex, gridSize)
  const column = getCellColumn(cellIndex, gridSize)
  const neighbors: number[] = []

  if (row > 0) {
    neighbors.push(cellIndex - gridSize)
  }
  if (row < gridSize - 1) {
    neighbors.push(cellIndex + gridSize)
  }
  if (column > 0) {
    neighbors.push(cellIndex - 1)
  }
  if (column < gridSize - 1) {
    neighbors.push(cellIndex + 1)
  }

  return neighbors
}

export function getPenIds(pensByCell: number[]) {
  return Array.from(new Set(pensByCell)).filter((penId) => penId > 0)
}

export function getPenCells(pensByCell: number[], penId: number) {
  const cells: number[] = []

  for (let cellIndex = 0; cellIndex < pensByCell.length; cellIndex += 1) {
    if (pensByCell[cellIndex] === penId) {
      cells.push(cellIndex)
    }
  }

  return cells
}

export function getBullIndexes(bullsByCell: boolean[]) {
  const cells: number[] = []

  for (let cellIndex = 0; cellIndex < bullsByCell.length; cellIndex += 1) {
    if (bullsByCell[cellIndex]) {
      cells.push(cellIndex)
    }
  }

  return cells
}

/** True when every cell of `cells` is reachable from the first one by orthogonal steps. */
export function isConnectedRegion(cells: number[], gridSize: number) {
  if (cells.length === 0) {
    return false
  }

  const remaining = new Set(cells)
  const queue = [cells[0]]
  remaining.delete(cells[0])

  while (queue.length > 0) {
    const current = queue.pop()

    if (current === undefined) {
      continue
    }

    for (const neighbor of getOrthogonalNeighbors(current, gridSize)) {
      if (!remaining.has(neighbor)) {
        continue
      }

      remaining.delete(neighbor)
      queue.push(neighbor)
    }
  }

  return remaining.size === 0
}

/**
 * Every way to place `bullsPerGroup` mutually non-touching bulls in a single row of `gridSize`
 * cells, as column lists. The solver walks the board a row at a time over exactly these.
 *
 * Cached because it depends only on the two numbers and the solver rebuilds it on every call.
 */
const rowPatternCache = new Map<string, number[][]>()

export function getRowPatterns(gridSize: number, bullsPerGroup: number) {
  const cacheKey = `${gridSize}:${bullsPerGroup}`
  const cached = rowPatternCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const patterns: number[][] = []
  const current: number[] = []

  function build(startColumn: number) {
    if (current.length === bullsPerGroup) {
      patterns.push([...current])
      return
    }

    for (let column = startColumn; column < gridSize; column += 1) {
      const previousColumn = current[current.length - 1]

      // Two bulls in the same row must have a gap between them.
      if (previousColumn !== undefined && column - previousColumn <= 1) {
        continue
      }

      current.push(column)
      build(column + 1)
      current.pop()
    }
  }

  build(0)
  rowPatternCache.set(cacheKey, patterns)

  return patterns
}
