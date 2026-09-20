/**
 * A QR Code encoder — **byte mode, error correction level H, versions 1 to 10**.
 *
 * Hand-written rather than pulled in, which is the same call P0–P5 made for the JWKS verifier, the
 * rate limiter, the security headers and the request logger. The reason here is bundle size: P14
 * fought the first load down to 134 KB gzipped, and a QR library is a poor thing to spend that on
 * when the job is one short URL. This is ~5 KB of source and tree-shakes to only what the share
 * dialog imports.
 *
 * **Why level H and not the usual M.** H recovers from ~30% loss, and that is what pays for the cow
 * sitting in the middle: the logo destroys real modules, and the decoder has to reconstruct them
 * from parity. At level M the same cutout is a coin flip. Everything below is sized for H, so the
 * capacity numbers are lower than a general-purpose encoder's.
 *
 * **Scope, deliberately.** Byte mode only (a URL is ASCII, and numeric/alphanumeric modes only pay
 * off for digits), versions 1–10 only (v10-H holds 119 bytes; the site's URL is 28). Anything longer
 * throws rather than silently producing a code nobody can scan. Kanji mode, ECI and structured
 * append are not implemented and are not coming.
 *
 * Verified three ways in `scripts/check-qr.mts`, because a QR that does not scan looks identical to
 * one that does: every block's codeword satisfies the Reed–Solomon syndrome check, the matrix is
 * decoded back to the original string by an independently written reader, and the structure
 * (finders, timing, dark module, format bits) is asserted directly.
 */

export type QrCode = {
  /** Modules per side, excluding the quiet zone. */
  size: number
  /** `modules[row][column]`, `true` meaning a dark module. */
  modules: boolean[][]
  version: number
}

/** v10-H in byte mode. Past this a different version table is needed, so it throws instead. */
export const QR_MAX_BYTES = 119

// ------------------------------------------------------------------ GF(256)

/*
  The field the Reed–Solomon codewords live in: bytes, with the primitive polynomial QR specifies
  (0x11D). `GF_EXP` is doubled in length so a log sum can be indexed without a modulo.
*/
const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)

{
  let value = 1
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = value
    GF_LOG[value] = i
    value <<= 1
    if (value & 0x100) {
      value ^= 0x11d
    }
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
}

function gfMultiply(a: number, b: number) {
  if (a === 0 || b === 0) {
    return 0
  }

  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

/** g(x) = ∏(x − α^i) for i < degree. Coefficients highest-power first. */
function generatorPolynomial(degree: number) {
  let poly = [1]

  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(poly.length + 1).fill(0)

    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMultiply(poly[j], GF_EXP[i])
    }

    poly = next
  }

  return poly
}

/** The remainder of data·x^ecCount divided by the generator — i.e. the parity codewords. */
function reedSolomonEncode(data: number[], ecCount: number) {
  const generator = generatorPolynomial(ecCount)
  const remainder = new Array<number>(ecCount).fill(0)

  for (const byte of data) {
    const factor = byte ^ remainder[0]
    remainder.shift()
    remainder.push(0)

    for (let i = 0; i < ecCount; i += 1) {
      remainder[i] ^= gfMultiply(generator[i + 1], factor)
    }
  }

  return remainder
}

// ------------------------------------------------------- the version tables

type VersionSpec = {
  version: number
  ecPerBlock: number
  /** `[blockCount, dataCodewordsPerBlock]`, one entry per group. */
  groups: [number, number][]
}

/*
  Error-correction structure for level H, versions 1–10, straight out of the specification.

  The invariant worth knowing when reading these: for every row, blocks × data + blocks × ec equals
  the version's total codeword count, and the byte capacity is the data total minus the header (2
  bytes up to v9, 3 from v10 where the character count grows to 16 bits). `check-qr.mts` asserts the
  first half of that, because a transcription slip here produces a code that scans as garbage rather
  than one that fails to build.
*/
const VERSION_SPECS: VersionSpec[] = [
  { version: 1, ecPerBlock: 17, groups: [[1, 9]] },
  { version: 2, ecPerBlock: 28, groups: [[1, 16]] },
  { version: 3, ecPerBlock: 22, groups: [[2, 13]] },
  { version: 4, ecPerBlock: 16, groups: [[4, 9]] },
  {
    version: 5,
    ecPerBlock: 22,
    groups: [
      [2, 11],
      [2, 12],
    ],
  },
  { version: 6, ecPerBlock: 28, groups: [[4, 15]] },
  {
    version: 7,
    ecPerBlock: 26,
    groups: [
      [4, 13],
      [1, 14],
    ],
  },
  {
    version: 8,
    ecPerBlock: 26,
    groups: [
      [4, 14],
      [2, 15],
    ],
  },
  {
    version: 9,
    ecPerBlock: 24,
    groups: [
      [4, 12],
      [4, 13],
    ],
  },
  {
    version: 10,
    ecPerBlock: 28,
    groups: [
      [6, 15],
      [2, 16],
    ],
  },
]

/** Alignment-pattern centre coordinates per version; both axes use the same list. */
const ALIGNMENT_CENTERS: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

function dataCodewordCount(spec: VersionSpec) {
  return spec.groups.reduce((total, [blocks, perBlock]) => total + blocks * perBlock, 0)
}

/** Bytes that fit once the mode indicator and character count are paid for. */
function byteCapacity(spec: VersionSpec) {
  return dataCodewordCount(spec) - (spec.version < 10 ? 2 : 3)
}

function selectVersion(byteLength: number) {
  const spec = VERSION_SPECS.find((candidate) => byteLength <= byteCapacity(candidate))

  if (!spec) {
    throw new Error(
      `QR payload is ${byteLength} bytes; the maximum supported here is ${QR_MAX_BYTES}.`,
    )
  }

  return spec
}

// ------------------------------------------------------------ bits and data

function encodeCodewords(bytes: Uint8Array, spec: VersionSpec) {
  const bits: number[] = []

  function push(value: number, length: number) {
    for (let i = length - 1; i >= 0; i -= 1) {
      bits.push((value >> i) & 1)
    }
  }

  push(0b0100, 4) // byte mode
  push(bytes.length, spec.version < 10 ? 8 : 16)
  for (const byte of bytes) {
    push(byte, 8)
  }

  const totalData = dataCodewordCount(spec)
  const capacityBits = totalData * 8

  // Terminator: four zero bits, or fewer if the data ends that close to capacity.
  push(0, Math.min(4, capacityBits - bits.length))
  while (bits.length % 8 !== 0) {
    bits.push(0)
  }

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j += 1) {
      byte = (byte << 1) | bits[i + j]
    }
    codewords.push(byte)
  }

  // The two pad bytes the specification names, alternating, until the block is full.
  const padBytes = [0xec, 0x11]
  for (let i = 0; codewords.length < totalData; i += 1) {
    codewords.push(padBytes[i % 2])
  }

  return codewords
}

/**
 * Split into blocks, add parity, then interleave — data codeword *i* of every block in turn, then
 * the parity the same way.
 *
 * The interleave is not decoration: it is what makes a scratch or a logo survivable. A contiguous
 * damaged area then costs each block a few codewords rather than destroying one block outright,
 * and each block is independently correctable.
 */
function buildFinalCodewords(dataCodewords: number[], spec: VersionSpec) {
  const blocks: { data: number[]; ec: number[] }[] = []
  let offset = 0

  for (const [blockCount, perBlock] of spec.groups) {
    for (let i = 0; i < blockCount; i += 1) {
      const data = dataCodewords.slice(offset, offset + perBlock)
      offset += perBlock
      blocks.push({ data, ec: reedSolomonEncode(data, spec.ecPerBlock) })
    }
  }

  const result: number[] = []
  const longestBlock = Math.max(...blocks.map((block) => block.data.length))

  for (let i = 0; i < longestBlock; i += 1) {
    for (const block of blocks) {
      if (i < block.data.length) {
        result.push(block.data[i])
      }
    }
  }

  for (let i = 0; i < spec.ecPerBlock; i += 1) {
    for (const block of blocks) {
      result.push(block.ec[i])
    }
  }

  return result
}

// --------------------------------------------------------------- the matrix

type Grid = {
  size: number
  modules: boolean[][]
  /** Function patterns and format areas, which data must skip and masking must not touch. */
  reserved: boolean[][]
}

function createGrid(size: number): Grid {
  return {
    size,
    modules: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  }
}

function setModule(grid: Grid, row: number, column: number, dark: boolean, reserve = true) {
  grid.modules[row][column] = dark
  if (reserve) {
    grid.reserved[row][column] = true
  }
}

function drawFinder(grid: Grid, row: number, column: number) {
  // The 7×7 eye plus its one-module separator, clipped at the edges of the symbol.
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const y = row + r
      const x = column + c

      if (y < 0 || y >= grid.size || x < 0 || x >= grid.size) {
        continue
      }

      const inOuterRing = (r === 0 || r === 6) && c >= 0 && c <= 6
      const inSideRing = (c === 0 || c === 6) && r >= 0 && r <= 6
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4

      setModule(grid, y, x, inOuterRing || inSideRing || inCore)
    }
  }
}

function drawAlignmentPatterns(grid: Grid, version: number) {
  const centers = ALIGNMENT_CENTERS[version - 1]

  for (const row of centers) {
    for (const column of centers) {
      // The three corners already carry finder patterns; an alignment pattern there would overwrite
      // them.
      const overlapsFinder =
        (row === 6 && column === 6) ||
        (row === 6 && column === grid.size - 7) ||
        (row === grid.size - 7 && column === 6)

      if (overlapsFinder) {
        continue
      }

      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          const isRing = Math.max(Math.abs(r), Math.abs(c)) !== 1
          setModule(grid, row + r, column + c, isRing)
        }
      }
    }
  }
}

function drawTimingPatterns(grid: Grid) {
  for (let i = 8; i < grid.size - 8; i += 1) {
    const dark = i % 2 === 0
    setModule(grid, 6, i, dark)
    setModule(grid, i, 6, dark)
  }
}

function reserveFormatAreas(grid: Grid, version: number) {
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      grid.reserved[8][i] = true
      grid.reserved[i][8] = true
    }
  }
  grid.reserved[8][6] = true
  grid.reserved[6][8] = true
  grid.reserved[8][8] = true

  for (let i = 0; i < 8; i += 1) {
    grid.reserved[8][grid.size - 1 - i] = true
    grid.reserved[grid.size - 1 - i][8] = true
  }

  // The one module that is always dark, and has no meaning beyond that.
  setModule(grid, grid.size - 8, 8, true)

  if (version >= 7) {
    for (let i = 0; i < 18; i += 1) {
      const row = Math.floor(i / 3)
      const column = grid.size - 11 + (i % 3)
      grid.reserved[row][column] = true
      grid.reserved[column][row] = true
    }
  }
}

/**
 * Data is written in a zigzag: two-module-wide columns from the right edge leftwards, alternating
 * upwards and downwards, skipping anything already reserved.
 *
 * **Column 6 is skipped entirely** — it is the vertical timing pattern, and not skipping it shifts
 * every subsequent module by one, which produces a perfectly well-formed code containing rubbish.
 */
function placeData(grid: Grid, codewords: number[]) {
  const { size } = grid
  let bitIndex = 0

  for (let right = size - 1; right >= 1; right -= 2) {
    /*
      When the pair would start at column 6 it is shifted one left instead, permanently: from here
      on the loop walks columns 5/4, 3/2, 1/0. Column 6 is never visited.

      Getting this wrong is the nastiest bug in the whole encoder, because it does not look like one
      — every module is still a legal module and the symbol still has the right shape. It simply
      shifts every bit after column 7 by one position, and the result is a perfectly well-formed QR
      code containing rubbish.
    */
    if (right === 6) {
      right = 5
    }

    /*
      Direction alternates per pair, derived from the column rather than carried in a flag — which
      is what makes the shift above harmless. A toggle would have to know it was skipped.
    */
    const upwards = ((right + 1) & 2) === 0

    for (let vertical = 0; vertical < size; vertical += 1) {
      const row = upwards ? size - 1 - vertical : vertical

      for (let offset = 0; offset < 2; offset += 1) {
        const column = right - offset

        if (grid.reserved[row][column]) {
          continue
        }

        // Past the end of the data the remaining modules stay light, which is what the
        // specification calls for.
        const byte = codewords[bitIndex >> 3] ?? 0
        grid.modules[row][column] = ((byte >> (7 - (bitIndex & 7))) & 1) === 1
        bitIndex += 1
      }
    }
  }
}

const MASK_FUNCTIONS: ((row: number, column: number) => boolean)[] = [
  (row, column) => (row + column) % 2 === 0,
  (row) => row % 2 === 0,
  (_row, column) => column % 3 === 0,
  (row, column) => (row + column) % 3 === 0,
  (row, column) => (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0,
  (row, column) => ((row * column) % 2) + ((row * column) % 3) === 0,
  (row, column) => (((row * column) % 2) + ((row * column) % 3)) % 2 === 0,
  (row, column) => (((row + column) % 2) + ((row * column) % 3)) % 2 === 0,
]

function applyMask(grid: Grid, maskIndex: number) {
  const mask = MASK_FUNCTIONS[maskIndex]

  for (let row = 0; row < grid.size; row += 1) {
    for (let column = 0; column < grid.size; column += 1) {
      if (!grid.reserved[row][column] && mask(row, column)) {
        grid.modules[row][column] = !grid.modules[row][column]
      }
    }
  }
}

const FINDER_LIKE = [true, false, true, true, true, false, true]

/**
 * The four penalty rules, summed. Lower is better, and the mask with the lowest total is the one
 * that ships — the point being to avoid large blocks of one colour and anything a scanner could
 * mistake for a finder pattern.
 */
function maskPenalty(grid: Grid) {
  const { size, modules } = grid
  let penalty = 0

  // Rule 1: runs of five or more identical modules along a row or column.
  for (let i = 0; i < size; i += 1) {
    for (const readRow of [true, false]) {
      let runColour = false
      let runLength = 0

      for (let j = 0; j < size; j += 1) {
        const dark = readRow ? modules[i][j] : modules[j][i]

        if (dark === runColour) {
          runLength += 1
        } else {
          runColour = dark
          runLength = 1
        }

        if (runLength === 5) {
          penalty += 3
        } else if (runLength > 5) {
          penalty += 1
        }
      }
    }
  }

  // Rule 2: every 2×2 block of one colour.
  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size - 1; column += 1) {
      const first = modules[row][column]

      if (
        first === modules[row][column + 1] &&
        first === modules[row + 1][column] &&
        first === modules[row + 1][column + 1]
      ) {
        penalty += 3
      }
    }
  }

  // Rule 3: a 1:1:3:1:1 finder-like run with four light modules on either side.
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j + 6 < size; j += 1) {
      for (const readRow of [true, false]) {
        const at = (offset: number) => (readRow ? modules[i][j + offset] : modules[j + offset][i])
        const matchesCore = FINDER_LIKE.every((expected, offset) => at(offset) === expected)

        if (!matchesCore) {
          continue
        }

        const isLight = (offset: number) => {
          const index = j + offset
          if (index < 0 || index >= size) {
            return true
          }
          return !(readRow ? modules[i][index] : modules[index][i])
        }

        // Scored per side: a run with four light modules on both sides looks twice as much like a
        // finder as one with them on a single side, and costs twice as much.
        if ([-4, -3, -2, -1].every(isLight)) {
          penalty += 40
        }

        if ([7, 8, 9, 10].every(isLight)) {
          penalty += 40
        }
      }
    }
  }

  // Rule 4: how far the proportion of dark modules strays from half.
  let darkCount = 0
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (modules[row][column]) {
        darkCount += 1
      }
    }
  }

  const darkPercent = (darkCount * 100) / (size * size)
  penalty += Math.floor(Math.abs(darkPercent - 50) / 5) * 10

  return penalty
}

/** BCH(15,5), then XOR with the fixed pattern so an all-zero format is never valid. */
function formatBits(maskIndex: number) {
  const ECC_LEVEL_H = 0b10
  const data = (ECC_LEVEL_H << 3) | maskIndex
  let remainder = data

  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >> 9) * 0x537)
  }

  return ((data << 10) | (remainder & 0x3ff)) ^ 0x5412
}

function drawFormatInfo(grid: Grid, maskIndex: number) {
  const bits = formatBits(maskIndex)
  const { size } = grid

  for (let i = 0; i < 15; i += 1) {
    const dark = ((bits >> i) & 1) === 1

    // First copy: down the left of the top-left finder, then right along the top.
    if (i < 6) {
      grid.modules[i][8] = dark
    } else if (i < 8) {
      grid.modules[i + 1][8] = dark
    } else if (i < 9) {
      grid.modules[8][7] = dark
    } else {
      grid.modules[8][14 - i] = dark
    }

    // Second copy, so a damaged corner does not cost the format.
    if (i < 8) {
      grid.modules[8][size - 1 - i] = dark
    } else {
      grid.modules[size - 15 + i][8] = dark
    }
  }
}

function drawVersionInfo(grid: Grid, version: number) {
  if (version < 7) {
    return
  }

  let remainder = version
  for (let i = 0; i < 12; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >> 11) * 0x1f25)
  }

  const bits = (version << 12) | (remainder & 0xfff)

  for (let i = 0; i < 18; i += 1) {
    const dark = ((bits >> i) & 1) === 1
    const row = Math.floor(i / 3)
    const column = grid.size - 11 + (i % 3)

    grid.modules[row][column] = dark
    grid.modules[column][row] = dark
  }
}

/**
 * Encodes `text` and returns the finished module matrix.
 *
 * No quiet zone is included — that is the renderer's business, and the share dialog adds it as SVG
 * padding. Scanners need at least four modules of it; without one, many will not see the code at
 * all even though every module is correct.
 */
export function encodeQrCode(text: string): QrCode {
  const bytes = new TextEncoder().encode(text)
  const spec = selectVersion(bytes.length)
  const codewords = buildFinalCodewords(encodeCodewords(bytes, spec), spec)
  const size = 17 + spec.version * 4

  function buildGrid() {
    const grid = createGrid(size)
    drawFinder(grid, 0, 0)
    drawFinder(grid, 0, size - 7)
    drawFinder(grid, size - 7, 0)
    drawAlignmentPatterns(grid, spec.version)
    drawTimingPatterns(grid)
    reserveFormatAreas(grid, spec.version)
    placeData(grid, codewords)
    return grid
  }

  // Each mask is scored on a full symbol, so the cheapest correct way to choose is to build all
  // eight. At 57×57 worst case that is trivial, and it keeps the scoring honest.
  let best: { grid: Grid; penalty: number } | null = null

  for (let maskIndex = 0; maskIndex < 8; maskIndex += 1) {
    const grid = buildGrid()
    applyMask(grid, maskIndex)
    drawFormatInfo(grid, maskIndex)
    drawVersionInfo(grid, spec.version)

    const penalty = maskPenalty(grid)

    if (!best || penalty < best.penalty) {
      best = { grid, penalty }
    }
  }

  if (!best) {
    throw new Error('QR encoding produced no candidate matrix.')
  }

  return { size, modules: best.grid.modules, version: spec.version }
}
