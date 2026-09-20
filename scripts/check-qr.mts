/**
 * Proves `src/lib/qrCode.ts` produces codes that actually scan.
 *
 * A broken QR encoder is invisible: the output is a tidy grid of squares either way, and the only
 * symptom is a phone that will not read it. So nothing here eyeballs the picture.
 *
 * Four independent checks, weakest to strongest:
 *
 * 1. **The version table is self-consistent** — blocks × data + blocks × parity must equal the
 *    version's total codeword count. Catches a transcription slip in the one table that cannot be
 *    derived from anything else.
 * 2. **Reed–Solomon syndromes are zero.** Every block's data+parity, evaluated at α^1…α^n, must
 *    vanish. This is the definition of a valid RS codeword and is computed here from the field
 *    arithmetic rather than from the encoder's own generator polynomial, so a wrong generator
 *    cannot pass it.
 * 3. **The matrix decodes back to the input**, using a reader written here from the specification:
 *    read the format bits, recover the mask, unmask, walk the zigzag, de-interleave the blocks,
 *    parse mode + length + payload. This is what catches placement, masking and interleave bugs.
 * 4. **Structure**: finder patterns, timing patterns, the always-dark module, and the two format
 *    copies agreeing with each other.
 *
 * `npm run check:qr`. No browser, no server, no database.
 */
import { encodeQrCode, QR_MAX_BYTES } from '../src/lib/qrCode'

let checks = 0
let failures = 0

function check(label: string, ok: boolean, detail = '') {
  checks += 1
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `\n        ${detail}` : ''}`)
}

// ---------------------------------------------------------------- GF(256), rebuilt here

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let value = 1
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = value
    LOG[value] = i
    value <<= 1
    if (value & 0x100) value ^= 0x11d
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255]
}

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

// -------------------------------------------------- the spec tables, transcribed independently

type Spec = { version: number; ec: number; groups: [number, number][] }

const SPECS: Spec[] = [
  { version: 1, ec: 17, groups: [[1, 9]] },
  { version: 2, ec: 28, groups: [[1, 16]] },
  { version: 3, ec: 22, groups: [[2, 13]] },
  { version: 4, ec: 16, groups: [[4, 9]] },
  { version: 5, ec: 22, groups: [[2, 11], [2, 12]] },
  { version: 6, ec: 28, groups: [[4, 15]] },
  { version: 7, ec: 26, groups: [[4, 13], [1, 14]] },
  { version: 8, ec: 26, groups: [[4, 14], [2, 15]] },
  { version: 9, ec: 24, groups: [[4, 12], [4, 13]] },
  { version: 10, ec: 28, groups: [[6, 15], [2, 16]] },
]

/** Total codewords per version, from the specification's capacity table. Independent of the above. */
const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346]

const ALIGNMENT: number[][] = [
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

console.log('\n--- 1. the version table is self-consistent ---\n')

for (const spec of SPECS) {
  const blocks = spec.groups.reduce((n, [count]) => n + count, 0)
  const data = spec.groups.reduce((n, [count, per]) => n + count * per, 0)
  const total = data + blocks * spec.ec
  const expected = TOTAL_CODEWORDS[spec.version - 1]

  check(
    `v${spec.version}-H: ${data} data + ${blocks}×${spec.ec} parity = ${total} codewords`,
    total === expected,
    `expected ${expected}`,
  )
}

// ------------------------------------------------------------------ the reader

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

/** Which modules are function patterns, derived here from the spec rather than from the encoder. */
function functionModuleMap(size: number, version: number) {
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const mark = (r: number, c: number) => {
    if (r >= 0 && r < size && c >= 0 && c < size) reserved[r][c] = true
  }

  for (const [baseRow, baseCol] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    for (let r = -1; r <= 7; r += 1) for (let c = -1; c <= 7; c += 1) mark(baseRow + r, baseCol + c)
  }

  for (let i = 0; i < size; i += 1) {
    mark(6, i)
    mark(i, 6)
  }

  const centers = ALIGNMENT[version - 1]
  for (const r of centers) {
    for (const c of centers) {
      const overlapsFinder =
        (r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)
      if (overlapsFinder) continue
      for (let dr = -2; dr <= 2; dr += 1) for (let dc = -2; dc <= 2; dc += 1) mark(r + dr, c + dc)
    }
  }

  for (let i = 0; i < 9; i += 1) {
    mark(8, i)
    mark(i, 8)
  }
  for (let i = 0; i < 8; i += 1) {
    mark(8, size - 1 - i)
    mark(size - 1 - i, 8)
  }

  if (version >= 7) {
    for (let i = 0; i < 18; i += 1) {
      const r = Math.floor(i / 3)
      const c = size - 11 + (i % 3)
      mark(r, c)
      mark(c, r)
    }
  }

  return reserved
}

function readFormat(modules: boolean[][], size: number) {
  let raw = 0
  for (let i = 0; i < 15; i += 1) {
    let dark: boolean
    if (i < 6) dark = modules[i][8]
    else if (i < 8) dark = modules[i + 1][8]
    else if (i < 9) dark = modules[8][7]
    else dark = modules[8][14 - i]
    if (dark) raw |= 1 << i
  }

  const bits = raw ^ 0x5412
  return { eccLevel: (bits >> 13) & 0b11, mask: (bits >> 10) & 0b111 }
}

/** The zigzag, walked in the same order the writer uses, straight from the specification. */
function readCodewords(modules: boolean[][], size: number, version: number, mask: number) {
  const reserved = functionModuleMap(size, version)
  const maskFn = MASKS[mask]
  const bits: number[] = []

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    const upwards = ((right + 1) & 2) === 0

    for (let vertical = 0; vertical < size; vertical += 1) {
      const row = upwards ? size - 1 - vertical : vertical

      for (let offset = 0; offset < 2; offset += 1) {
        const column = right - offset
        if (reserved[row][column]) continue
        const dark = modules[row][column] !== maskFn(row, column)
        bits.push(dark ? 1 : 0)
      }
    }
  }

  const codewords: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j]
    codewords.push(byte)
  }

  return codewords
}

/** Undo the interleave, returning each block's data+parity separately. */
function deinterleave(codewords: number[], spec: Spec) {
  const layout = spec.groups.flatMap(([count, per]) =>
    Array.from({ length: count }, () => ({ data: [] as number[], ec: [] as number[], per })),
  )

  let index = 0
  const longest = Math.max(...layout.map((block) => block.per))
  for (let i = 0; i < longest; i += 1) {
    for (const block of layout) {
      if (i < block.per) block.data.push(codewords[index++])
    }
  }
  for (let i = 0; i < spec.ec; i += 1) {
    for (const block of layout) block.ec.push(codewords[index++])
  }

  return layout
}

/**
 * Every root of the generator must also be a root of the codeword.
 *
 * **QR's generator is ∏(x − α^i) for i from 0**, so the roots are α⁰…α^(n−1) — not α¹…αⁿ, which is
 * the convention several other Reed–Solomon uses follow and which this check was written with on
 * the first pass. It failed every block while the decoder round-tripped every string, which is the
 * giveaway: data that reads back correctly cannot have broken parity.
 */
function syndromesAreZero(codeword: number[], ecCount: number) {
  for (let i = 0; i < ecCount; i += 1) {
    let sum = 0
    for (const byte of codeword) sum = mul(sum, EXP[i]) ^ byte
    if (sum !== 0) return false
  }
  return true
}

function decodePayload(blocks: { data: number[] }[], version: number) {
  const stream = blocks.flatMap((block) => block.data)
  const bits: number[] = []
  for (const byte of stream) for (let i = 7; i >= 0; i -= 1) bits.push((byte >> i) & 1)

  let cursor = 0
  const take = (length: number) => {
    let value = 0
    for (let i = 0; i < length; i += 1) value = (value << 1) | bits[cursor++]
    return value
  }

  const mode = take(4)
  if (mode !== 0b0100) throw new Error(`mode was ${mode.toString(2)}, expected byte mode 0100`)

  const length = take(version < 10 ? 8 : 16)
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i += 1) bytes[i] = take(8)

  return new TextDecoder().decode(bytes)
}

// ------------------------------------------------------------------ the round trip

console.log('\n--- 2 & 3. syndromes vanish, and the matrix decodes back ---\n')

const SAMPLES = [
  'https://cowfield.vercel.app/',
  'https://cowfield.vercel.app/uk',
  'A',
  'HELLO WORLD',
  'https://cowfield.vercel.app/game/extreme/173?from=share',
  'a'.repeat(64),
  'a'.repeat(98),
  'a'.repeat(QR_MAX_BYTES),
]

for (const sample of SAMPLES) {
  const label = sample.length > 34 ? `${sample.slice(0, 31)}…` : sample

  try {
    const code = encodeQrCode(sample)
    const spec = SPECS[code.version - 1]
    const format = readFormat(code.modules, code.size)

    check(
      `"${label}" — v${code.version}, ${code.size}×${code.size}, ECC level H`,
      format.eccLevel === 0b10,
      `format reports level bits ${format.eccLevel.toString(2)}`,
    )

    const codewords = readCodewords(code.modules, code.size, code.version, format.mask)
    const blocks = deinterleave(codewords, spec)

    const everyBlockValid = blocks.every((block) =>
      syndromesAreZero([...block.data, ...block.ec], spec.ec),
    )
    check(`"${label}" — all ${blocks.length} RS blocks have zero syndromes`, everyBlockValid)

    const decoded = decodePayload(blocks, code.version)
    check(`"${label}" — decodes back to the original`, decoded === sample, `got "${decoded}"`)
  } catch (error) {
    check(`"${label}" — encodes and decodes`, false, String(error))
  }
}

console.log('\n--- 4. structure ---\n')

{
  const code = encodeQrCode('https://cowfield.vercel.app/')
  const { modules, size } = code

  const finderOk = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ].every(([baseRow, baseCol]) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const ring = r === 0 || r === 6 || c === 0 || c === 6
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
        if (modules[baseRow + r][baseCol + c] !== (ring || core)) return false
      }
    }
    return true
  })
  check('all three finder patterns are correct', finderOk)

  let timingOk = true
  for (let i = 8; i < size - 8; i += 1) {
    if (modules[6][i] !== (i % 2 === 0) || modules[i][6] !== (i % 2 === 0)) timingOk = false
  }
  check('both timing patterns alternate', timingOk)

  check('the always-dark module is dark', modules[size - 8][8])

  // The two format copies must carry the same 15 bits, or a scanner reading the wrong one fails.
  let copiesAgree = true
  for (let i = 0; i < 15; i += 1) {
    const first =
      i < 6 ? modules[i][8] : i < 8 ? modules[i + 1][8] : i < 9 ? modules[8][7] : modules[8][14 - i]
    const second = i < 8 ? modules[8][size - 1 - i] : modules[size - 15 + i][8]
    if (first !== second) copiesAgree = false
  }
  check('both format-information copies agree', copiesAgree)

  const tooLong = 'a'.repeat(QR_MAX_BYTES + 1)
  let threw = false
  try {
    encodeQrCode(tooLong)
  } catch {
    threw = true
  }
  check(`${QR_MAX_BYTES + 1} bytes is refused rather than silently truncated`, threw)
}

console.log(`\n${checks - failures}/${checks} passed\n`)
process.exit(failures ? 1 : 0)
