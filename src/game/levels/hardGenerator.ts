import type { LevelDraft } from '../types'
import { validateLevelDraft } from '../validation'

type BullPair = {
  left: number
  right: number
}

type PenGrowthState = {
  pensByCell: number[]
  penCells: Map<number, Set<number>>
  penBullPairs: Map<number, BullPair>
}

type TerritoryState = {
  preferredPenByCell: number[]
  targetPenSizes: Map<number, number>
}

function shuffle<T>(items: T[]) {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]]
  }

  return nextItems
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getCellRow(index: number, gridSize: number) {
  return Math.floor(index / gridSize)
}

function getCellColumn(index: number, gridSize: number) {
  return index % gridSize
}

function getOrthogonalNeighbors(index: number, gridSize: number) {
  const row = getCellRow(index, gridSize)
  const column = getCellColumn(index, gridSize)
  const neighbors: number[] = []

  if (row > 0) {
    neighbors.push(index - gridSize)
  }
  if (row < gridSize - 1) {
    neighbors.push(index + gridSize)
  }
  if (column > 0) {
    neighbors.push(index - 1)
  }
  if (column < gridSize - 1) {
    neighbors.push(index + 1)
  }

  return neighbors
}

function manhattanDistance(left: number, right: number, gridSize: number) {
  return (
    Math.abs(getCellRow(left, gridSize) - getCellRow(right, gridSize)) +
    Math.abs(getCellColumn(left, gridSize) - getCellColumn(right, gridSize))
  )
}

function buildHardRowPatterns(gridSize: number) {
  const patterns: number[][] = []

  for (let firstColumn = 0; firstColumn < gridSize; firstColumn += 1) {
    for (let secondColumn = firstColumn + 2; secondColumn < gridSize; secondColumn += 1) {
      patterns.push([firstColumn, secondColumn])
    }
  }

  return patterns
}

function buildHardCowLayout(gridSize: number) {
  const patterns = buildHardRowPatterns(gridSize)
  const columnCounts = Array.from({ length: gridSize }, () => 0)
  const chosenPatterns = Array.from({ length: gridSize }, () => [] as number[])

  function search(rowIndex: number, previousPattern: number[]) {
    if (rowIndex === gridSize) {
      return columnCounts.every((count) => count === 2)
    }

    const remainingRows = gridSize - rowIndex - 1

    for (const pattern of shuffle(patterns)) {
      const touchesPreviousRow = pattern.some((column) =>
        previousPattern.some((previousColumn) => Math.abs(column - previousColumn) <= 1),
      )

      if (touchesPreviousRow) {
        continue
      }

      if (pattern.some((column) => columnCounts[column] + 1 > 2)) {
        continue
      }

      for (const column of pattern) {
        columnCounts[column] += 1
      }

      const columnsStillPossible = columnCounts.every(
        (count) => count <= 2 && count + remainingRows * 2 >= 2,
      )

      if (columnsStillPossible) {
        chosenPatterns[rowIndex] = pattern

        if (search(rowIndex + 1, pattern)) {
          return true
        }
      }

      chosenPatterns[rowIndex] = []

      for (const column of pattern) {
        columnCounts[column] -= 1
      }
    }

    return false
  }

  if (!search(0, [])) {
    return null
  }

  return chosenPatterns.flatMap((pattern, rowIndex) =>
    pattern.map((column) => rowIndex * gridSize + column),
  )
}

function scoreBullPair(left: number, right: number, gridSize: number) {
  const distance = manhattanDistance(left, right, gridSize)
  const rowDistance = Math.abs(getCellRow(left, gridSize) - getCellRow(right, gridSize))
  const columnDistance = Math.abs(getCellColumn(left, gridSize) - getCellColumn(right, gridSize))

  let score = 0

  score -= Math.abs(distance - 4) * 3
  score += rowDistance > 0 && columnDistance > 0 ? 7 : -5
  score += rowDistance >= 2 ? 3 : -2
  score += columnDistance >= 2 ? 3 : -2
  score -= rowDistance === 0 ? 6 : 0
  score -= columnDistance === 0 ? 4 : 0

  return score
}

function scoreBullPairing(pairs: BullPair[], gridSize: number) {
  let score = 0

  for (const pair of pairs) {
    score += scoreBullPair(pair.left, pair.right, gridSize)
  }

  const [firstPair, secondPair] = pairs

  if (firstPair && secondPair) {
    const firstColumns = [
      getCellColumn(firstPair.left, gridSize),
      getCellColumn(firstPair.right, gridSize),
    ].sort((left, right) => left - right)
    const secondColumns = [
      getCellColumn(secondPair.left, gridSize),
      getCellColumn(secondPair.right, gridSize),
    ].sort((left, right) => left - right)
    const firstCenter = (firstColumns[0] + firstColumns[1]) / 2
    const secondCenter = (secondColumns[0] + secondColumns[1]) / 2

    score += Math.abs(firstCenter - secondCenter) >= 2 ? 4 : -4
    score += firstColumns[1] < secondColumns[0] || secondColumns[1] < firstColumns[0] ? 3 : -2
  }

  return score
}

function buildBullPairs(cowIndexes: number[], gridSize: number) {
  const bullsByRow = new Map<number, number[]>()

  for (const cellIndex of cowIndexes) {
    const row = getCellRow(cellIndex, gridSize)
    const rowCells = bullsByRow.get(row) ?? []
    rowCells.push(cellIndex)
    rowCells.sort((left, right) => getCellColumn(left, gridSize) - getCellColumn(right, gridSize))
    bullsByRow.set(row, rowCells)
  }

  const pairs: BullPair[] = []

  for (let row = 0; row < gridSize; row += 2) {
    const topRowBulls = bullsByRow.get(row) ?? []
    const bottomRowBulls = bullsByRow.get(row + 1) ?? []

    if (topRowBulls.length !== 2 || bottomRowBulls.length !== 2) {
      return null
    }

    const [topLeft, topRight] = topRowBulls
    const [bottomLeft, bottomRight] = bottomRowBulls
    const candidatePairings: BullPair[][] = [
      [
        { left: topLeft, right: bottomLeft },
        { left: topRight, right: bottomRight },
      ],
      [
        { left: topLeft, right: bottomRight },
        { left: topRight, right: bottomLeft },
      ],
      [
        { left: topLeft, right: topRight },
        { left: bottomLeft, right: bottomRight },
      ],
    ]

    const bestPairing = candidatePairings
      .map((candidate) => ({
        candidate,
        score: scoreBullPairing(candidate, gridSize) + Math.random() * 1.5,
      }))
      .sort((left, right) => right.score - left.score)[0]?.candidate

    if (!bestPairing) {
      return null
    }

    pairs.push(...bestPairing)
  }

  return pairs
}

function buildPathBetweenPair(
  pair: BullPair,
  pensByCell: number[],
  blockedBullCells: Set<number>,
  gridSize: number,
) {
  const queue = [pair.left]
  const parents = new Map<number, number | null>([[pair.left, null]])

  while (queue.length > 0) {
    const current = queue.shift()

    if (current === undefined) {
      continue
    }

    if (current === pair.right) {
      const path: number[] = []
      let node: number | null = current

      while (node !== null) {
        path.push(node)
        node = parents.get(node) ?? null
      }

      return path.reverse()
    }

    const currentRow = getCellRow(current, gridSize)
    const currentColumn = getCellColumn(current, gridSize)
    const targetRow = getCellRow(pair.right, gridSize)
    const targetColumn = getCellColumn(pair.right, gridSize)

    const nextNeighbors = shuffle(getOrthogonalNeighbors(current, gridSize)).sort((left, right) => {
      const leftDistance =
        Math.abs(getCellRow(left, gridSize) - targetRow) +
        Math.abs(getCellColumn(left, gridSize) - targetColumn)
      const rightDistance =
        Math.abs(getCellRow(right, gridSize) - targetRow) +
        Math.abs(getCellColumn(right, gridSize) - targetColumn)
      const leftTurnPenalty =
        (getCellRow(left, gridSize) !== currentRow ? 0.4 : 0) +
        (getCellColumn(left, gridSize) !== currentColumn ? 0.4 : 0)
      const rightTurnPenalty =
        (getCellRow(right, gridSize) !== currentRow ? 0.4 : 0) +
        (getCellColumn(right, gridSize) !== currentColumn ? 0.4 : 0)

      return leftDistance + leftTurnPenalty - (rightDistance + rightTurnPenalty)
    })

    for (const neighbor of nextNeighbors) {
      if (parents.has(neighbor)) {
        continue
      }

      if (neighbor !== pair.right && blockedBullCells.has(neighbor)) {
        continue
      }

      if (neighbor !== pair.right && pensByCell[neighbor] !== 0) {
        continue
      }

      parents.set(neighbor, current)
      queue.push(neighbor)
    }
  }

  return null
}

function getBoundingBox(cells: Set<number>, gridSize: number) {
  const rows = Array.from(cells, (cell) => getCellRow(cell, gridSize))
  const columns = Array.from(cells, (cell) => getCellColumn(cell, gridSize))

  return {
    minRow: Math.min(...rows),
    maxRow: Math.max(...rows),
    minColumn: Math.min(...columns),
    maxColumn: Math.max(...columns),
  }
}

function getPenFrontierCells(state: PenGrowthState, penId: number, gridSize: number) {
  const frontier = new Set<number>()
  const penCells = state.penCells.get(penId)

  if (!penCells) {
    return []
  }

  for (const cell of penCells) {
    for (const neighbor of getOrthogonalNeighbors(cell, gridSize)) {
      if (state.pensByCell[neighbor] === 0) {
        frontier.add(neighbor)
      }
    }
  }

  return Array.from(frontier)
}

function buildPairTerritories(state: PenGrowthState, gridSize: number): TerritoryState {
  const totalCells = gridSize * gridSize
  const preferredPenByCell = Array.from({ length: totalCells }, () => 0)
  const targetPenSizes = new Map<number, number>()

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
    const existingPenId = state.pensByCell[cellIndex]

    if (existingPenId > 0) {
      preferredPenByCell[cellIndex] = existingPenId
      targetPenSizes.set(existingPenId, (targetPenSizes.get(existingPenId) ?? 0) + 1)
      continue
    }

    let bestPenId = 0
    let bestScore = Number.NEGATIVE_INFINITY

    for (const [penId, pair] of state.penBullPairs.entries()) {
      const leftDistance = manhattanDistance(cellIndex, pair.left, gridSize)
      const rightDistance = manhattanDistance(cellIndex, pair.right, gridSize)
      const pairCenterRow = (getCellRow(pair.left, gridSize) + getCellRow(pair.right, gridSize)) / 2
      const pairCenterColumn =
        (getCellColumn(pair.left, gridSize) + getCellColumn(pair.right, gridSize)) / 2
      const centerDistance =
        Math.abs(getCellRow(cellIndex, gridSize) - pairCenterRow) +
        Math.abs(getCellColumn(cellIndex, gridSize) - pairCenterColumn)
      const rowSpread = Math.abs(getCellRow(pair.left, gridSize) - getCellRow(pair.right, gridSize))
      const columnSpread = Math.abs(
        getCellColumn(pair.left, gridSize) - getCellColumn(pair.right, gridSize),
      )
      const sameRowPenalty =
        rowSpread <= 1 && getCellRow(cellIndex, gridSize) === Math.round(pairCenterRow) ? 1.8 : 0
      const sameColumnPenalty =
        columnSpread <= 1 &&
        getCellColumn(cellIndex, gridSize) === Math.round(pairCenterColumn)
          ? 1.8
          : 0
      const score =
        -(leftDistance + rightDistance) * 1.4 -
        centerDistance * 0.9 +
        Math.min(leftDistance, rightDistance) * 0.35 -
        sameRowPenalty -
        sameColumnPenalty +
        Math.random() * 0.2

      if (score > bestScore) {
        bestScore = score
        bestPenId = penId
      }
    }

    preferredPenByCell[cellIndex] = bestPenId
    targetPenSizes.set(bestPenId, (targetPenSizes.get(bestPenId) ?? 0) + 1)
  }

  return {
    preferredPenByCell,
    targetPenSizes,
  }
}

function scoreFrontierCell(
  state: PenGrowthState,
  territory: TerritoryState,
  penId: number,
  cell: number,
  gridSize: number,
) {
  const penCells = state.penCells.get(penId)
  const pair = state.penBullPairs.get(penId)
  const targetPenSize = territory.targetPenSizes.get(penId) ?? Math.floor((gridSize * gridSize) / 10)

  if (!penCells) {
    return Number.NEGATIVE_INFINITY
  }

  const box = getBoundingBox(penCells, gridSize)
  const nextRows = [box.minRow, box.maxRow, getCellRow(cell, gridSize)]
  const nextColumns = [box.minColumn, box.maxColumn, getCellColumn(cell, gridSize)]
  const nextHeight = Math.max(...nextRows) - Math.min(...nextRows) + 1
  const nextWidth = Math.max(...nextColumns) - Math.min(...nextColumns) + 1
  const longestSide = Math.max(nextHeight, nextWidth)
  const shortestSide = Math.min(nextHeight, nextWidth)
  const samePenNeighbors = getOrthogonalNeighbors(cell, gridSize).filter(
    (neighbor) => state.pensByCell[neighbor] === penId,
  ).length
  const emptyNeighbors = getOrthogonalNeighbors(cell, gridSize).filter(
    (neighbor) => state.pensByCell[neighbor] === 0,
  ).length
  const rowCount = Array.from(penCells).filter(
    (existingCell) => getCellRow(existingCell, gridSize) === getCellRow(cell, gridSize),
  ).length
  const columnCount = Array.from(penCells).filter(
    (existingCell) => getCellColumn(existingCell, gridSize) === getCellColumn(cell, gridSize),
  ).length
  const pairCenterRow = pair
    ? (getCellRow(pair.left, gridSize) + getCellRow(pair.right, gridSize)) / 2
    : (box.minRow + box.maxRow) / 2
  const pairCenterColumn = pair
    ? (getCellColumn(pair.left, gridSize) + getCellColumn(pair.right, gridSize)) / 2
    : (box.minColumn + box.maxColumn) / 2
  const distanceFromPairCenter =
    Math.abs(getCellRow(cell, gridSize) - pairCenterRow) +
    Math.abs(getCellColumn(cell, gridSize) - pairCenterColumn)
  const territoryOwner = territory.preferredPenByCell[cell]
  const territoryMismatch = territoryOwner !== penId
  const currentPenSize = penCells.size

  let score = 0

  score += samePenNeighbors * 5
  score += emptyNeighbors * 1.5
  score -= distanceFromPairCenter * 1.4
  score += territoryMismatch ? -12 : 10
  score -= Math.max(longestSide - Math.max(shortestSide + 3, 4), 0) * 5
  score -= rowCount >= Math.ceil(targetPenSize * 0.7) ? 6 : 0
  score -= columnCount >= Math.ceil(targetPenSize * 0.7) ? 6 : 0
  score -= longestSide >= 8 && shortestSide <= 2 ? 10 : 0
  score -= currentPenSize > targetPenSize && samePenNeighbors <= 1 ? 8 : 0
  score -= currentPenSize >= targetPenSize + 2 ? 16 : 0
  score += Math.random() * 1.2

  return score
}

function scorePenShape(
  pensByCell: number[],
  penCells: Map<number, Set<number>>,
  penId: number,
  gridSize: number,
  targetPenSize: number,
) {
  const cells = penCells.get(penId)

  if (!cells || cells.size === 0) {
    return Number.NEGATIVE_INFINITY
  }

  const box = getBoundingBox(cells, gridSize)
  const width = box.maxColumn - box.minColumn + 1
  const height = box.maxRow - box.minRow + 1
  const rowHistogram = new Map<number, number>()
  const columnHistogram = new Map<number, number>()
  let borderContacts = 0

  for (const cell of cells) {
    const row = getCellRow(cell, gridSize)
    const column = getCellColumn(cell, gridSize)

    rowHistogram.set(row, (rowHistogram.get(row) ?? 0) + 1)
    columnHistogram.set(column, (columnHistogram.get(column) ?? 0) + 1)

    for (const neighbor of getOrthogonalNeighbors(cell, gridSize)) {
      if (pensByCell[neighbor] !== penId) {
        borderContacts += 1
      }
    }
  }

  let score = 0

  score -= Math.abs(cells.size - targetPenSize) * 2
  score -= Math.max(width - (height + 3), 0) * 6
  score -= Math.max(height - (width + 3), 0) * 6
  score -= width >= 8 && height <= 2 ? 12 : 0
  score -= height >= 8 && width <= 2 ? 12 : 0
  score -= Math.max(...rowHistogram.values()) >= Math.ceil(targetPenSize * 0.75) ? 8 : 0
  score -= Math.max(...columnHistogram.values()) >= Math.ceil(targetPenSize * 0.75) ? 8 : 0
  score += borderContacts * 0.35

  return score
}

function seedPensFromBullPairs(pairs: BullPair[], gridSize: number) {
  const totalCells = gridSize * gridSize
  const pensByCell = Array.from({ length: totalCells }, () => 0)
  const penCells = new Map<number, Set<number>>()
  const penBullPairs = new Map<number, BullPair>()
  const cowsByCell = Array.from({ length: totalCells }, () => false)
  const blockedBullCells = new Set<number>(
    pairs.flatMap((pair) => [pair.left, pair.right]),
  )

  for (const [pairIndex, pair] of pairs.entries()) {
    const penId = pairIndex + 1
    const path = buildPathBetweenPair(pair, pensByCell, blockedBullCells, gridSize)

    if (!path) {
      return null
    }

    const cells = new Set<number>()

    for (const cell of path) {
      if (pensByCell[cell] !== 0) {
        return null
      }

      pensByCell[cell] = penId
      cells.add(cell)
    }

    cowsByCell[pair.left] = true
    cowsByCell[pair.right] = true
    penCells.set(penId, cells)
    penBullPairs.set(penId, pair)
  }

  return {
    pensByCell,
    penCells,
    penBullPairs,
    cowsByCell,
  }
}

function growPairedPens(seedState: ReturnType<typeof seedPensFromBullPairs>, gridSize: number) {
  if (!seedState) {
    return null
  }

  const state: PenGrowthState = {
    pensByCell: [...seedState.pensByCell],
    penCells: new Map(
      Array.from(seedState.penCells.entries(), ([penId, cells]) => [penId, new Set(cells)]),
    ),
    penBullPairs: new Map(seedState.penBullPairs),
  }
  const totalCells = gridSize * gridSize
  const territory = buildPairTerritories(state, gridSize)
  const fallbackTargetPenSize = Math.floor(totalCells / 10)
  const maxPenSizeByPen = new Map(
    Array.from(state.penCells.keys(), (penId) => [
      penId,
      (territory.targetPenSizes.get(penId) ?? fallbackTargetPenSize) + 2,
    ]),
  )
  let emptyCount = state.pensByCell.filter((penId) => penId === 0).length
  const penIds = shuffle(Array.from(state.penCells.keys()))
  let stalledPasses = 0

  while (emptyCount > 0 && stalledPasses < totalCells * 4) {
    const candidatePenIds = penIds
      .filter((penId) => {
        const frontier = getPenFrontierCells(state, penId, gridSize)
        return (
          frontier.length > 0 &&
          (state.penCells.get(penId)?.size ?? 0) < (maxPenSizeByPen.get(penId) ?? fallbackTargetPenSize + 2)
        )
      })
      .sort((left, right) => {
        const leftTarget = territory.targetPenSizes.get(left) ?? fallbackTargetPenSize
        const rightTarget = territory.targetPenSizes.get(right) ?? fallbackTargetPenSize
        const leftGap = leftTarget - (state.penCells.get(left)?.size ?? 0)
        const rightGap = rightTarget - (state.penCells.get(right)?.size ?? 0)
        return rightGap - leftGap
      })

    if (candidatePenIds.length === 0) {
      break
    }

    let placedThisPass = 0

    for (const penId of candidatePenIds) {
      const frontier = getPenFrontierCells(state, penId, gridSize).sort(
        (left, right) =>
          scoreFrontierCell(state, territory, penId, right, gridSize) -
          scoreFrontierCell(state, territory, penId, left, gridSize),
      )
      const ownedFrontier = frontier.filter((cell) => territory.preferredPenByCell[cell] === penId)
      const nextCell = ownedFrontier[0] ?? frontier[0]

      if (nextCell === undefined || state.pensByCell[nextCell] !== 0) {
        continue
      }

      state.pensByCell[nextCell] = penId
      state.penCells.get(penId)?.add(nextCell)
      emptyCount -= 1
      placedThisPass += 1

      if (emptyCount === 0) {
        break
      }
    }

    stalledPasses = placedThisPass === 0 ? stalledPasses + 1 : 0
  }

  while (emptyCount > 0) {
    const emptyCells = state.pensByCell
      .map((penId, cellIndex) => ({ penId, cellIndex }))
      .filter((entry) => entry.penId === 0)
      .map((entry) => entry.cellIndex)

    const nextCell = emptyCells[randomInt(0, emptyCells.length - 1)]
    const neighboringPenIds = shuffle(
      Array.from(
        new Set(
          getOrthogonalNeighbors(nextCell, gridSize)
            .map((neighbor) => state.pensByCell[neighbor])
            .filter((penId) => penId > 0),
        ),
      ),
    ).sort(
      (left, right) =>
        scoreFrontierCell(state, territory, right, nextCell, gridSize) -
        scoreFrontierCell(state, territory, left, nextCell, gridSize),
    )
    const chosenPenId = neighboringPenIds[0]

    if (chosenPenId === undefined) {
      return null
    }

    state.pensByCell[nextCell] = chosenPenId
    state.penCells.get(chosenPenId)?.add(nextCell)
    emptyCount -= 1
  }

  return {
    pensByCell: state.pensByCell,
    penCells: state.penCells,
  }
}

function isConnectedWithoutCell(
  cells: Set<number>,
  removedCell: number,
  gridSize: number,
) {
  const remainingCells = Array.from(cells).filter((cell) => cell !== removedCell)

  if (remainingCells.length === 0) {
    return false
  }

  const queue = [remainingCells[0]]
  const visited = new Set<number>([remainingCells[0]])

  while (queue.length > 0) {
    const current = queue.shift()

    if (current === undefined) {
      continue
    }

    for (const neighbor of getOrthogonalNeighbors(current, gridSize)) {
      if (neighbor === removedCell || !cells.has(neighbor) || visited.has(neighbor)) {
        continue
      }

      visited.add(neighbor)
      queue.push(neighbor)
    }
  }

  return visited.size === remainingCells.length
}

function improvePenLayout(
  pensByCell: number[],
  penCells: Map<number, Set<number>>,
  gridSize: number,
  iterations = 140,
) {
  const targetPenSize = Math.floor((gridSize * gridSize) / 10)

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const borderCells = shuffle(
      pensByCell
        .map((penId, cellIndex) => ({ penId, cellIndex }))
        .filter((entry) => entry.penId > 0)
        .filter((entry) =>
          getOrthogonalNeighbors(entry.cellIndex, gridSize).some(
            (neighbor) => pensByCell[neighbor] > 0 && pensByCell[neighbor] !== entry.penId,
          ),
        ),
    )

    const candidate = borderCells[0]

    if (!candidate) {
      continue
    }

    const sourcePenId = candidate.penId
    const sourceCells = penCells.get(sourcePenId)

    if (!sourceCells || sourceCells.size <= 3) {
      continue
    }

    if (!isConnectedWithoutCell(sourceCells, candidate.cellIndex, gridSize)) {
      continue
    }

    const neighboringPenIds = shuffle(
      Array.from(
        new Set(
          getOrthogonalNeighbors(candidate.cellIndex, gridSize)
            .map((neighbor) => pensByCell[neighbor])
            .filter((penId) => penId > 0 && penId !== sourcePenId),
        ),
      ),
    )

    for (const targetPenId of neighboringPenIds) {
      const targetCells = penCells.get(targetPenId)

      if (!targetCells) {
        continue
      }

      const beforeScore =
        scorePenShape(pensByCell, penCells, sourcePenId, gridSize, targetPenSize) +
        scorePenShape(pensByCell, penCells, targetPenId, gridSize, targetPenSize)

      pensByCell[candidate.cellIndex] = targetPenId
      sourceCells.delete(candidate.cellIndex)
      targetCells.add(candidate.cellIndex)

      const afterScore =
        scorePenShape(pensByCell, penCells, sourcePenId, gridSize, targetPenSize) +
        scorePenShape(pensByCell, penCells, targetPenId, gridSize, targetPenSize)

      if (afterScore >= beforeScore - 2) {
        break
      }

      pensByCell[candidate.cellIndex] = sourcePenId
      targetCells.delete(candidate.cellIndex)
      sourceCells.add(candidate.cellIndex)
    }
  }

  return pensByCell
}

export function generateHardLevelDraft(levelNumber: number, title: string): LevelDraft | null {
  const gridSize = 10
  const maxAttempts = 500

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const cowIndexes = buildHardCowLayout(gridSize)

    if (!cowIndexes) {
      continue
    }

    const bullPairs = buildBullPairs(cowIndexes, gridSize)

    if (!bullPairs) {
      continue
    }

    const seededPens = seedPensFromBullPairs(bullPairs, gridSize)

    if (!seededPens) {
      continue
    }

    const grownPens = growPairedPens(seededPens, gridSize)

    if (!grownPens) {
      continue
    }

    const improvedPensByCell = improvePenLayout(
      [...grownPens.pensByCell],
      new Map(Array.from(grownPens.penCells.entries(), ([penId, cells]) => [penId, new Set(cells)])),
      gridSize,
    )

    const draft = {
      levelNumber,
      title,
      difficulty: 'hard',
      gridSize,
      pensByCell: improvedPensByCell,
      cowsByCell: Array.from({ length: gridSize * gridSize }, (_, cellIndex) =>
        cowIndexes.includes(cellIndex),
      ),
    } satisfies LevelDraft

    const validationResult = validateLevelDraft(draft)

    if (validationResult.isValid) {
      console.info(
        `[hard-generator] Generated hard level ${levelNumber} after ${attempt + 1} attempt(s).`,
      )
      return draft
    }
  }

  console.warn(
    `[hard-generator] Failed to generate hard level ${levelNumber} after ${maxAttempts} attempt(s).`,
  )
  return null
}
