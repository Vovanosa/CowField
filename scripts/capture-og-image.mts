/**
 * Renders `public/og-image.png` — the 1200x630 image every shared link shows.
 *
 * A screenshot of the **real game page**, not an illustration: it is the product, it can never drift
 * from what a visitor actually sees, and it costs no dependency (headless Chrome over CDP, the same
 * technique as `check-accessibility.mts`). Re-run it whenever the board's look changes.
 *
 * It signs in as a guest, opens the gentlest level and places a handful of marks so the board reads
 * as a puzzle in progress rather than an empty grid — deliberately *not* a solved board, since a
 * marketing image should not hand out a solution.
 *
 * **Run it with both servers up:**
 *   terminal 1:  npm run server:start
 *   terminal 2:  npm run dev
 *   terminal 3:  npm run og:image
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const APP = process.env.A11Y_APP_URL ?? 'http://localhost:5173'
const DEBUG_PORT = Number(process.env.A11Y_DEBUG_PORT ?? 9223)
const OUTPUT = new URL('../public/og-image.png', import.meta.url).pathname.replace(/^\//, '')

/** Open Graph's standard size. Declared in `index.html` as `og:image:width` / `:height`. */
const WIDTH = 1200
const HEIGHT = 630

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((path): path is string => Boolean(path))

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

try {
  await fetch(APP)
} catch {
  console.error(`\nThe web app is not reachable at ${APP}. Start it with: npm run dev\n`)
  process.exit(2)
}

const chromePath = CHROME_CANDIDATES.find((path) => existsSync(path))

if (!chromePath) {
  console.error('\nNo Chrome or Edge found. Set CHROME_PATH to the executable.\n')
  process.exit(2)
}

const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cowfield-og-'))}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
  ],
  { stdio: 'ignore' },
)

async function pageTargetUrl() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)
      const targets = (await response.json()) as { type: string; webSocketDebuggerUrl?: string }[]
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* still starting */
    }
    await sleep(200)
  }
  throw new Error('Chrome never exposed a page target')
}

const socket = new WebSocket(await pageTargetUrl())
await new Promise<void>((resolve, reject) => {
  socket.addEventListener('open', () => resolve(), { once: true })
  socket.addEventListener('error', () => reject(new Error('CDP socket failed')), { once: true })
})

let nextId = 1
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (e: Error) => void }>()
const waiters: { method: string; resolve: () => void }[] = []

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data)) as {
    id?: number
    method?: string
    error?: unknown
    result?: unknown
  }

  if (message.id && pending.has(message.id)) {
    const entry = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) entry?.reject(new Error(JSON.stringify(message.error)))
    else entry?.resolve(message.result)
    return
  }

  if (message.method) {
    for (let index = waiters.length - 1; index >= 0; index -= 1) {
      if (waiters[index].method === message.method) waiters.splice(index, 1)[0].resolve()
    }
  }
})

function send(method: string, params: Record<string, unknown> = {}) {
  const id = nextId
  nextId += 1
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise<Record<string, unknown>>((resolve, reject) =>
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject }),
  )
}

function waitForEvent(method: string, timeoutMs = 20000) {
  return new Promise<void>((resolve, reject) => {
    waiters.push({ method, resolve })
    setTimeout(() => reject(new Error(`timed out waiting for ${method}`)), timeoutMs)
  })
}

async function evaluate<T>(body: string) {
  const result = (await send('Runtime.evaluate', {
    expression: `(() => { ${body} })()`,
    returnByValue: true,
    awaitPromise: true,
  })) as {
    result?: { value?: T }
    exceptionDetails?: { exception?: { description?: string } }
  }

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'page threw')
  }

  return result.result?.value as T
}

async function goto(path: string) {
  const loaded = waitForEvent('Page.loadEventFired')
  await send('Page.navigate', { url: `${APP}${path}` })
  await loaded
}

async function waitFor(expression: string, label: string, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate<boolean>(`return Boolean(${expression})`)) return
    await sleep(150)
  }
  throw new Error(`timed out waiting for ${label}`)
}

await send('Page.enable')
await send('Runtime.enable')
/*
  Rendered tall, then **cropped** to the Open Graph aspect ratio.

  Shooting a 1200x630 viewport directly does not work: the board is height-aware (`100cqh`), so a
  630px-tall window renders a ~320px board floating in a mostly empty frame — the first attempt at
  this looked like a screenshot of the chrome, not of a puzzle. Rendering at full height lets the
  board reach its 640px cap, and the crop below then centres on the board and the control bar and
  leaves the account row out of frame.
*/
const RENDER_WIDTH = 1400
const RENDER_HEIGHT = 1100
const ASPECT = WIDTH / HEIGHT

/**
 * Breathing room around the board, as a multiple of its height.
 *
 * The crop is driven by **height**, not width, and that is forced by geometry rather than taste: the
 * board is square, so in a 1.905:1 frame it can occupy at most 630/1200 — about **49%** of the
 * width — without being cut off. An attempt to make it fill 72% of the width sliced the top and
 * bottom rows off the board, which is worse than empty margins by a wide margin.
 */
const BOARD_HEIGHT_PADDING = 1.08

/**
 * Rendered at 2x so the crop is *downscaled* to 1200 wide rather than upscaled.
 *
 * The board's own CSS caps it at 640 logical pixels (`min(100%, 640px, 100cqh)`), so cropping at 1x
 * and enlarging to fill an Open Graph image comes out soft. Note that CDP multiplies the clip's
 * `scale` by this factor, so the scale below has to divide it back out — the first run produced a
 * 2400x1261 file for exactly that reason.
 */
const DEVICE_SCALE = 2

await send('Emulation.setDeviceMetricsOverride', {
  width: RENDER_WIDTH,
  height: RENDER_HEIGHT,
  deviceScaleFactor: DEVICE_SCALE,
  mobile: false,
})

const CELLS = `Array.from(document.querySelectorAll('button[class*="boardCell"]'))`

await goto('/login')
await waitFor(`document.body.textContent.includes('Play as guest')`, 'the login page')
await evaluate(`
  Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Play as guest').click()
  return true
`)
await waitFor(`location.pathname === '/'`, 'home after guest sign-in')

await goto('/game/easy/1')
await waitFor(`${CELLS}.length === 64`, 'the easy board')
await sleep(600)

/**
 * A partly-played board. Two clicks make a bull, one makes a dot — these positions are picked to be
 * legal-looking and spread out, and there are far too few of them to be a solution.
 */
async function click(cellIndex: number, times: number) {
  const point = await evaluate<{ x: number; y: number }>(`
    const rect = ${CELLS}[${cellIndex}].getBoundingClientRect()
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
  `)

  for (let index = 0; index < times; index += 1) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point, button: 'none', buttons: 0 })
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...point,
      button: 'left',
      buttons: 1,
      clickCount: 1,
    })
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...point,
      button: 'left',
      buttons: 0,
      clickCount: 1,
    })
    await sleep(60)
  }
}

for (const cellIndex of [2, 24, 43]) {
  await click(cellIndex, 2) // bull
}
for (const cellIndex of [9, 11, 17, 33, 35, 50, 58]) {
  await click(cellIndex, 1) // dot
}

// Move the pointer off the board so no cell is left in its hover state.
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 4, y: 4, button: 'none', buttons: 0 })
await sleep(500)

/*
  The crop: as wide as the frame, as tall as the Open Graph ratio allows, and positioned so the
  board sits in the middle. `scale` does the resizing, so the output is exactly 1200x630 with no
  image library involved.
*/
const board = await evaluate<{ top: number; height: number; left: number; width: number }>(`
  const rect = document.querySelector('[class*="boardPreview"]').getBoundingClientRect()
  return {
    top: Math.round(rect.top),
    height: Math.round(rect.height),
    left: Math.round(rect.left),
    width: Math.round(rect.width),
  }
`)

const clipWidth = Math.min(
  RENDER_WIDTH,
  Math.round(board.height * BOARD_HEIGHT_PADDING * ASPECT),
)
const clipHeight = Math.round(clipWidth / ASPECT)
const boardCentreX = board.left + board.width / 2
const boardCentreY = board.top + board.height / 2
const clipX = Math.max(0, Math.min(boardCentreX - clipWidth / 2, RENDER_WIDTH - clipWidth))
const clipY = Math.max(0, Math.min(boardCentreY - clipHeight / 2, RENDER_HEIGHT - clipHeight))

const shot = (await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: false,
  clip: {
    x: Math.round(clipX),
    y: Math.round(clipY),
    width: clipWidth,
    height: clipHeight,
    scale: WIDTH / clipWidth / DEVICE_SCALE,
  },
})) as {
  data: string
}

console.log(
  `board ${board.width}x${board.height} at y=${board.top}; cropped ${clipWidth}x${clipHeight} from y=${Math.round(clipY)}`,
)

writeFileSync(OUTPUT, Buffer.from(shot.data, 'base64'))

const bytes = Buffer.from(shot.data, 'base64').length
console.log(`Wrote ${OUTPUT}`)
console.log(`${WIDTH}x${HEIGHT}, ${(bytes / 1024).toFixed(0)} KB`)

socket.close()
chrome.kill()
process.exit(0)
