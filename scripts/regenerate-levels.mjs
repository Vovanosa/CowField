import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const levelsRoot = path.join(repoRoot, 'levels_data')
const difficulties = ['light', 'easy', 'medium']
const levelsPerDifficulty = 50

function getGridSizeForDifficulty(difficulty) {
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

function getBullsPerGroupForDifficulty(difficulty) {
  return difficulty === 'hard' ? 2 : 1
}

function shuffle(items) {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]]
  }

  return nextItems
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getOrthogonalNeighbors(index, gridSize) {
  const row = Math.floor(index / gridSize)
  const column = index % gridSize
  const neighbors = []

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

function buildSingleCowSeedColumns(gridSize) {
  const columns = Array.from({ length: gridSize }, (_, index) => index)
  const chosenColumns = Array.from({ length: gridSize }, () => -1)
  const usedColumns = new Set()

  function search(rowIndex) {
    if (rowIndex === gridSize) {
      return true
    }

    const previousColumn = rowIndex > 0 ? chosenColumns[rowIndex - 1] : null
    const availableColumns = shuffle(
      columns.filter((column) => {
        if (usedColumns.has(column)) {
          return false
        }

        if (previousColumn !== null && Math.abs(column - previousColumn) <= 1) {
          return false
        }

        return true
      }),
    )

    for (const column of availableColumns) {
      chosenColumns[rowIndex] = column
      usedColumns.add(column)

      if (search(rowIndex + 1)) {
        return true
      }

      chosenColumns[rowIndex] = -1
      usedColumns.delete(column)
    }

    return false
  }

  return search(0) ? chosenColumns : null
}

function getFrontierCells(pensByCell, penId, gridSize) {
  const frontier = new Set()

  pensByCell.forEach((currentPenId, cellIndex) => {
    if (currentPenId !== penId) {
      return
    }

    for (const neighbor of getOrthogonalNeighbors(cellIndex, gridSize)) {
      if (pensByCell[neighbor] === 0) {
        frontier.add(neighbor)
      }
    }
  })

  return Array.from(frontier)
}

function buildCompletePensFromSeeds(seedColumns, gridSize) {
  const totalCells = gridSize * gridSize
  const pensByCell = Array.from({ length: totalCells }, () => 0)
  const cowsByCell = Array.from({ length: totalCells }, () => false)
  const shuffledPenIds = shuffle(Array.from({ length: gridSize }, (_, index) => index + 1))
  const bullCellsByPen = new Map()
  const penSizes = new Map()
  const maxPenSize = Math.max(gridSize + 2, 4 * gridSize - 8)
  const maxBurst = Math.max(1, gridSize - 2)

  for (let row = 0; row < gridSize; row += 1) {
    const column = seedColumns[row]
    const cellIndex = row * gridSize + column
    const penId = shuffledPenIds[row]
    pensByCell[cellIndex] = penId
    cowsByCell[cellIndex] = true
    bullCellsByPen.set(penId, cellIndex)
    penSizes.set(penId, 1)
  }

  let emptyCount = totalCells - gridSize
  let idleRounds = 0

  while (emptyCount > 0 && idleRounds < totalCells * 3) {
    const growablePenIds = shuffledPenIds.filter((penId) => {
      const frontier = getFrontierCells(pensByCell, penId, gridSize)
      return frontier.length > 0 && (penSizes.get(penId) ?? 0) < maxPenSize
    })

    if (growablePenIds.length === 0) {
      break
    }

    const penId = growablePenIds[randomInt(0, growablePenIds.length - 1)]
    const burstLength = randomInt(1, maxBurst)
    let placedDuringBurst = 0

    for (let step = 0; step < burstLength; step += 1) {
      if ((penSizes.get(penId) ?? 0) >= maxPenSize) {
        break
      }

      const frontier = shuffle(getFrontierCells(pensByCell, penId, gridSize)).sort((left, right) => {
        const leftEmptyNeighbors = getOrthogonalNeighbors(left, gridSize)
          .filter((neighbor) => pensByCell[neighbor] === 0).length
        const rightEmptyNeighbors = getOrthogonalNeighbors(right, gridSize)
          .filter((neighbor) => pensByCell[neighbor] === 0).length
        const bullCell = bullCellsByPen.get(penId) ?? left
        const leftDistance =
          Math.abs(Math.floor(left / gridSize) - Math.floor(bullCell / gridSize)) +
          Math.abs((left % gridSize) - (bullCell % gridSize))
        const rightDistance =
          Math.abs(Math.floor(right / gridSize) - Math.floor(bullCell / gridSize)) +
          Math.abs((right % gridSize) - (bullCell % gridSize))

        if (rightEmptyNeighbors !== leftEmptyNeighbors) {
          return rightEmptyNeighbors - leftEmptyNeighbors
        }

        return leftDistance - rightDistance
      })

      const nextCell = frontier[0]

      if (nextCell === undefined) {
        break
      }

      pensByCell[nextCell] = penId
      penSizes.set(penId, (penSizes.get(penId) ?? 0) + 1)
      emptyCount -= 1
      placedDuringBurst += 1

      if (emptyCount === 0) {
        break
      }
    }

    idleRounds = placedDuringBurst === 0 ? idleRounds + 1 : 0
  }

  while (emptyCount > 0) {
    const emptyCells = pensByCell
      .map((penId, cellIndex) => ({ penId, cellIndex }))
      .filter((entry) => entry.penId === 0)
      .map((entry) => entry.cellIndex)

    const nextCell = emptyCells[randomInt(0, emptyCells.length - 1)]
    const neighboringPenIds = shuffle(
      Array.from(
        new Set(
          getOrthogonalNeighbors(nextCell, gridSize)
            .map((neighbor) => pensByCell[neighbor])
            .filter((penId) => penId > 0),
        ),
      ),
    ).sort((left, right) => (penSizes.get(left) ?? 0) - (penSizes.get(right) ?? 0))

    const chosenPenId = neighboringPenIds[0]

    if (chosenPenId === undefined) {
      return null
    }

    pensByCell[nextCell] = chosenPenId
    penSizes.set(chosenPenId, (penSizes.get(chosenPenId) ?? 0) + 1)
    emptyCount -= 1
  }

  return {
    pensByCell,
    cowsByCell,
  }
}

function isConnectedPen(cells, gridSize) {
  if (cells.length === 0) {
    return false
  }

  const remaining = new Set(cells)
  const queue = [cells[0]]
  remaining.delete(cells[0])

  while (queue.length > 0) {
    const current = queue.shift()

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

function buildRowPatterns(gridSize, bullsPerGroup) {
  const patterns = []

  function backtrack(startColumn, current) {
    if (current.length === bullsPerGroup) {
      patterns.push([...current])
      return
    }

    for (let column = startColumn; column < gridSize; column += 1) {
      const previous = current[current.length - 1]
      if (previous !== undefined && column - previous <= 1) {
        continue
      }

      current.push(column)
      backtrack(column + 1, current)
      current.pop()
    }
  }

  backtrack(0, [])
  return patterns
}

function countLevelSolutions(draft, bullsPerGroup) {
  const { gridSize, pensByCell } = draft
  const patterns = buildRowPatterns(gridSize, bullsPerGroup)
  const columnCounts = Array.from({ length: gridSize }, () => 0)
  const penCounts = new Map()
  const penIds = Array.from(new Set(pensByCell)).filter((penId) => penId > 0)

  for (const penId of penIds) {
    penCounts.set(penId, 0)
  }

  let solutions = 0

  function search(rowIndex, previousPattern) {
    if (solutions > 1) {
      return
    }

    if (rowIndex === gridSize) {
      const columnsValid = columnCounts.every((count) => count === bullsPerGroup)
      const pensValid = Array.from(penCounts.values()).every((count) => count === bullsPerGroup)

      if (columnsValid && pensValid) {
        solutions += 1
      }
      return
    }

    const remainingRows = gridSize - rowIndex - 1

    for (const pattern of patterns) {
      let blockedByAdjacency = false

      for (const column of pattern) {
        for (const previousColumn of previousPattern) {
          if (Math.abs(column - previousColumn) <= 1) {
            blockedByAdjacency = true
            break
          }
        }

        if (blockedByAdjacency) {
          break
        }
      }

      if (blockedByAdjacency) {
        continue
      }

      const touchedPens = new Map()
      let invalidPattern = false

      for (const column of pattern) {
        const cellIndex = rowIndex * gridSize + column
        const penId = pensByCell[cellIndex]
        const nextColumnCount = columnCounts[column] + 1
        const nextPenCount = (penCounts.get(penId) ?? 0) + 1

        if (nextColumnCount > bullsPerGroup || nextPenCount > bullsPerGroup) {
          invalidPattern = true
          break
        }

        columnCounts[column] = nextColumnCount
        penCounts.set(penId, nextPenCount)
        touchedPens.set(penId, nextPenCount)
      }

      if (!invalidPattern) {
        const columnsStillPossible = columnCounts.every(
          (count) => count <= bullsPerGroup && count + remainingRows >= bullsPerGroup,
        )

        if (columnsStillPossible) {
          search(rowIndex + 1, pattern)
        }
      }

      for (const column of pattern) {
        const cellIndex = rowIndex * gridSize + column
        const penId = pensByCell[cellIndex]

        if (!touchedPens.has(penId)) {
          continue
        }

        columnCounts[column] -= 1
        penCounts.set(penId, (penCounts.get(penId) ?? 1) - 1)
      }
    }
  }

  search(0, [])
  return solutions
}

function validateLevelDraft(draft) {
  const bullsPerGroup = getBullsPerGroupForDifficulty(draft.difficulty)
  const issues = []
  const expectedGridSize = getGridSizeForDifficulty(draft.difficulty)

  if (!draft.title.trim()) {
    issues.push('Add a level title.')
  }

  if (draft.gridSize !== expectedGridSize) {
    issues.push(`Grid size must stay ${expectedGridSize} x ${expectedGridSize} for ${draft.difficulty}.`)
  }

  if (draft.pensByCell.length !== draft.gridSize * draft.gridSize) {
    issues.push('The pen grid is incomplete.')
  }

  const distinctPenIds = Array.from(new Set(draft.pensByCell)).filter((penId) => penId > 0)

  if (draft.pensByCell.some((penId) => penId === 0)) {
    issues.push('Every cell must belong to a pen.')
  }

  if (distinctPenIds.length !== draft.gridSize) {
    issues.push(`A ${draft.gridSize} x ${draft.gridSize} level must use exactly ${draft.gridSize} pens.`)
  }

  for (const penId of distinctPenIds) {
    const cells = draft.pensByCell
      .map((value, index) => ({ value, index }))
      .filter((entry) => entry.value === penId)
      .map((entry) => entry.index)

    if (cells.length < bullsPerGroup) {
      issues.push(`Pen ${penId} is too small for ${bullsPerGroup} bull placements.`)
    }

    if (!isConnectedPen(cells, draft.gridSize)) {
      issues.push(`Pen ${penId} must be one connected polyomino.`)
    }
  }

  if (issues.length > 0) {
    return { isValid: false }
  }

  const solutionCount = countLevelSolutions(draft, bullsPerGroup)
  return { isValid: solutionCount > 0 }
}

function generateLevelDraft(levelNumber, title, difficulty) {
  const bullsPerGroup = getBullsPerGroupForDifficulty(difficulty)

  if (bullsPerGroup !== 1) {
    return null
  }

  const gridSize = getGridSizeForDifficulty(difficulty)
  const maxAttempts = 200

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const seedColumns = buildSingleCowSeedColumns(gridSize)

    if (!seedColumns) {
      continue
    }

    const completedPens = buildCompletePensFromSeeds(seedColumns, gridSize)

    if (!completedPens) {
      continue
    }

    const draft = {
      levelNumber,
      title,
      difficulty,
      gridSize,
      pensByCell: completedPens.pensByCell,
      cowsByCell: completedPens.cowsByCell,
    }

    if (validateLevelDraft(draft).isValid) {
      return draft
    }
  }

  return null
}

async function clearDifficultyDirectory(difficulty) {
  const difficultyDirectory = path.join(levelsRoot, difficulty)
  await mkdir(difficultyDirectory, { recursive: true })
  const entries = await readdir(difficultyDirectory, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => rm(path.join(difficultyDirectory, entry.name))),
  )
}

async function saveDraft(difficulty, levelNumber) {
  const title = `Level ${levelNumber}`
  const draft = generateLevelDraft(levelNumber, title, difficulty)

  if (!draft) {
    throw new Error(`Failed to generate ${difficulty} level ${levelNumber}.`)
  }

  const timestamp = new Date().toISOString()
  const record = {
    difficulty: draft.difficulty,
    levelNumber: draft.levelNumber,
    title: draft.title,
    gridSize: draft.gridSize,
    colorsByCell: draft.pensByCell,
    cowsByCell: draft.cowsByCell,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const outputPath = path.join(levelsRoot, difficulty, `${levelNumber}.json`)
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
}

async function main() {
  for (const difficulty of difficulties) {
    console.log(`Clearing ${difficulty} levels...`)
    await clearDifficultyDirectory(difficulty)

    console.log(`Generating ${levelsPerDifficulty} ${difficulty} levels...`)
    for (let levelNumber = 1; levelNumber <= levelsPerDifficulty; levelNumber += 1) {
      await saveDraft(difficulty, levelNumber)
      console.log(`  ${difficulty} ${levelNumber}/${levelsPerDifficulty}`)
    }
  }

  console.log('Finished regenerating light, easy, and medium levels.')
}

await main()
