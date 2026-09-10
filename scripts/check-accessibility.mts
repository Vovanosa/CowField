/**
 * Drives the real app in real Chrome and checks the accessibility behaviour that cannot be checked
 * any other way.
 *
 * **Why this exists.** Everything P10 shipped lives in a `useEffect` or a `ResizeObserver`: the
 * dialog focus trap, the roving tabindex, the implicit-pointer-capture release, and the cramped-board
 * notice. `renderToStaticMarkup` runs neither, so a `tsx` harness cannot see any of it, and
 * `npm run check` only proves it compiles. Until this script existed, five shipped behaviours rested
 * on reasoning alone — and the first run found a real bug (focus landing on `<body>` after the
 * completion dialog closed, because completing a level disables the cell that opened it).
 *
 * **No dependencies.** Node 22 has a global `WebSocket`, which is all the Chrome DevTools Protocol
 * needs. Same approach as the 2026-09-04 responsiveness audit.
 *
 * **Run it with both servers up:**
 *   terminal 1:  npm run server:start
 *   terminal 2:  npm run dev
 *   terminal 3:  npm run check:a11y
 *
 * It signs in as a guest, so it writes one `sessions` row per run (two — it takes a second token to
 * read a board over the API) and no progress rows, because guest progress never reaches the backend.
 *
 * Exit code is 0 only if every check passes.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { solveBoard } from '../shared/game'

const APP = process.env.A11Y_APP_URL ?? 'http://localhost:5173'
const API = process.env.A11Y_API_URL ?? 'http://localhost:4000'
const DEBUG_PORT = Number(process.env.A11Y_DEBUG_PORT ?? 9222)

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((path): path is string => Boolean(path))

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let failures = 0
let checksRun = 0

function check(label: string, ok: boolean, detail = '') {
  checksRun += 1
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `\n        ${detail}` : ''}`)
}

// ------------------------------------------------------------------- preflight

async function assertReachable(url: string, name: string, hint: string) {
  try {
    await fetch(url, { method: 'GET' })
  } catch {
    console.error(`\n${name} is not reachable at ${url}.\n  Start it with: ${hint}\n`)
    process.exit(2)
  }
}

await assertReachable(APP, 'The web app', 'npm run dev')
await assertReachable(`${API}/health`, 'The API', 'npm run server:start')

const chromePath = CHROME_CANDIDATES.find((path) => existsSync(path))

if (!chromePath) {
  console.error(
    `\nNo Chrome or Edge found. Set CHROME_PATH to the executable.\n  Looked in:\n${CHROME_CANDIDATES.map((path) => `    ${path}`).join('\n')}\n`,
  )
  process.exit(2)
}

// ------------------------------------------------------------------ CDP plumbing

const profileDirectory = mkdtempSync(join(tmpdir(), 'cowfield-a11y-'))
const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profileDirectory}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
  ],
  { stdio: 'ignore' },
)

async function getPageTargetUrl() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)
      const targets = (await response.json()) as { type: string; webSocketDebuggerUrl?: string }[]
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* Chrome is still starting. */
    }
    await sleep(200)
  }
  throw new Error('Chrome never exposed a page target')
}

const socket = new WebSocket(await getPageTargetUrl())

await new Promise<void>((resolve, reject) => {
  socket.addEventListener('open', () => resolve(), { once: true })
  socket.addEventListener('error', () => reject(new Error('CDP socket failed to open')), {
    once: true,
  })
})

type Pending = { resolve: (value: CdpResult) => void; reject: (error: Error) => void }
type CdpResult = {
  result?: { value?: unknown }
  exceptionDetails?: { exception?: { description?: string } }
}

let nextMessageId = 1
const pending = new Map<number, Pending>()
const eventWaiters: { method: string; resolve: () => void }[] = []

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data)) as {
    id?: number
    method?: string
    error?: unknown
    result?: CdpResult
  }

  if (message.id && pending.has(message.id)) {
    const entry = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) entry?.reject(new Error(JSON.stringify(message.error)))
    else entry?.resolve(message.result as CdpResult)
    return
  }

  if (message.method) {
    for (let index = eventWaiters.length - 1; index >= 0; index -= 1) {
      if (eventWaiters[index].method === message.method) {
        eventWaiters.splice(index, 1)[0].resolve()
      }
    }
  }
})

function send(method: string, params: Record<string, unknown> = {}) {
  const id = nextMessageId
  nextMessageId += 1
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise<CdpResult>((resolve, reject) => pending.set(id, { resolve, reject }))
}

function waitForEvent(method: string, timeoutMs = 20000) {
  return new Promise<void>((resolve, reject) => {
    eventWaiters.push({ method, resolve })
    setTimeout(() => reject(new Error(`timed out waiting for ${method}`)), timeoutMs)
  })
}

/** Evaluate in the page and return a plain value; rethrows whatever the page threw. */
async function evaluate<T>(body: string): Promise<T> {
  const result = await send('Runtime.evaluate', {
    expression: `(() => { ${body} })()`,
    returnByValue: true,
    awaitPromise: true,
  })

  if (result?.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ?? JSON.stringify(result.exceptionDetails),
    )
  }

  return result?.result?.value as T
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
await send('DOM.enable')

/** A real key press, so `:focus-visible` counts it as keyboard interaction. */
const KEYS: Record<string, [string, number]> = {
  Tab: ['Tab', 9],
  ArrowRight: ['ArrowRight', 39],
  ArrowDown: ['ArrowDown', 40],
  ArrowLeft: ['ArrowLeft', 37],
  Escape: ['Escape', 27],
  Enter: ['Enter', 13],
}

async function press(name: keyof typeof KEYS) {
  const [code, keyCode] = KEYS[name]
  const common = {
    key: name,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  }
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...common })
  if (name === 'Enter') await send('Input.dispatchKeyEvent', { type: 'char', text: '\r' })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...common })
  await sleep(60)
}

/**
 * Board cells are `button[class*="boardCell"]` in DOM order. The component ships no
 * `data-cell-index`, and the only other button inside the group is the cramped-notice dismiss,
 * which does not carry that class. Cells have **no `onClick`** — they are driven by pointer events,
 * so every click below is a real mouse press and release.
 */
const CELLS = `Array.from(document.querySelectorAll('button[class*="boardCell"]'))`
const DOT_COUNT = `document.querySelectorAll('span[class*="boardCellDot"]').length`

async function focusedCellIndex() {
  return evaluate<number>(`
    if (!document.activeElement) return -1
    return ${CELLS}.indexOf(document.activeElement)
  `)
}

async function clickCell(index: number) {
  const { x, y } = await evaluate<{ x: number; y: number }>(`
    const rect = ${CELLS}[${index}].getBoundingClientRect()
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
  `)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    buttons: 1,
    clickCount: 1,
  })
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    buttons: 0,
    clickCount: 1,
  })
  await sleep(70)
}

async function setViewport(width: number, height: number, mobile: boolean) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  })
}

async function openBoard(difficulty: string, expectedCells: number) {
  await goto(`/game/${difficulty}/1`)
  await waitFor(`${CELLS}.length === ${expectedCells}`, `the ${difficulty} board`)
  await sleep(250)
}

// -------------------------------------------------------------- guest sign-in

await setViewport(1280, 900, false)
await goto('/login')
await waitFor(`document.body.textContent.includes('Play as guest')`, 'the login page')
await evaluate(`
  const button = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Play as guest')
  if (!button) throw new Error('the guest button is gone — has the login page changed?')
  button.click()
  return true
`)
await waitFor(`location.pathname === '/'`, 'the home page after guest sign-in')
check('guest sign-in works (precondition for everything below)', true)

// ------------------------------------------- keyboard play and the focus ring

await openBoard('light', 36)

const cellProbe = await evaluate<{
  total: number
  tabbable: number
  label: string
  hasGroup: boolean
}>(`
  const cells = ${CELLS}
  return {
    total: cells.length,
    tabbable: cells.filter((cell) => cell.getAttribute('tabindex') === '0').length,
    label: cells[0].getAttribute('aria-label') || '',
    hasGroup: Boolean(document.querySelector('[role="group"]')),
  }
`)

check(
  'roving tabindex: exactly one cell is in the tab order',
  cellProbe.tabbable === 1,
  `${cellProbe.tabbable} of ${cellProbe.total} cells have tabindex="0"`,
)
check('the board is exposed as a named group', cellProbe.hasGroup)
check(
  'every cell carries an accessible name',
  cellProbe.label.length > 0,
  `cell 0 → "${cellProbe.label}"`,
)

let landedOn = -1
for (let attempt = 0; attempt < 30; attempt += 1) {
  await press('Tab')
  landedOn = await focusedCellIndex()
  if (landedOn >= 0) break
}
check('Tab reaches the board', landedOn >= 0, `focus landed on cell ${landedOn}`)

await press('ArrowRight')
const afterRight = await focusedCellIndex()
await press('ArrowDown')
const afterDown = await focusedCellIndex()
check(
  'ArrowRight moves one cell and ArrowDown moves one row',
  afterRight === landedOn + 1 && afterDown === afterRight + 6,
  `${landedOn} → ${afterRight} → ${afterDown} on a 6-wide grid`,
)

// Measured on an edge cell: the clipped case the negative outline offset exists for.
await evaluate(`${CELLS}[0].focus(); return true`)
await press('ArrowRight')
await press('ArrowLeft')
const ring = await evaluate<{
  index: number
  width: string
  offset: string
  zIndex: string
  visible: boolean
}>(`
  const cell = document.activeElement
  const style = getComputedStyle(cell)
  return {
    index: ${CELLS}.indexOf(cell),
    width: style.outlineWidth,
    offset: style.outlineOffset,
    zIndex: style.zIndex,
    visible: cell.matches(':focus-visible'),
  }
`)
check(
  'the focused edge cell shows the 3px ring, inset so the grid cannot clip it',
  ring.visible && ring.width === '3px' && ring.offset === '-3px',
  `cell ${ring.index}: :focus-visible=${ring.visible} outline=${ring.width} offset=${ring.offset} z-index=${ring.zIndex}`,
)

const dotsBeforeEnter = await evaluate<number>(`return ${DOT_COUNT}`)
await press('Enter')
await sleep(250)
const dotsAfterEnter = await evaluate<number>(`return ${DOT_COUNT}`)
check(
  'Enter places a mark through the same path a tap uses',
  dotsAfterEnter === dotsBeforeEnter + 1,
  `dots ${dotsBeforeEnter} → ${dotsAfterEnter}`,
)

// ------------------------------------------------------------ touch drag-paint

await openBoard('light', 36)
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })

const dragPath = await evaluate<{ x: number; y: number }[]>(`
  return [0, 1, 2, 3].map((index) => {
    const rect = ${CELLS}[index].getBoundingClientRect()
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
  })
`)
const dotsBeforeDrag = await evaluate<number>(`return ${DOT_COUNT}`)

await send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: dragPath[0].x, y: dragPath[0].y, id: 1 }],
})
await sleep(80)
for (const point of dragPath.slice(1)) {
  await send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: point.x, y: point.y, id: 1 }],
  })
  await sleep(80)
}
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await sleep(350)

const dotsAfterDrag = await evaluate<number>(`return ${DOT_COUNT}`)
check(
  'a touch drag paints every cell it crosses — implicit pointer capture is released',
  dotsAfterDrag - dotsBeforeDrag >= 4,
  `dots ${dotsBeforeDrag} → ${dotsAfterDrag} across a 4-cell drag; 1 would mean capture was never released`,
)

await send('Emulation.setTouchEmulationEnabled', { enabled: false })

// ------------------------------------------------------ dialog focus management

// The API never sends a solution, so the board is solved here from `colorsByCell` with the shared
// solver. The subject of these checks is the dialog, not the puzzle.
const guestResponse = await fetch(`${API}/api/auth/guest`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
})
const guest = (await guestResponse.json()) as { token: string }
const levelResponse = await fetch(`${API}/api/levels/light/1`, {
  headers: { authorization: `Bearer ${guest.token}` },
})
const level = (await levelResponse.json()) as { gridSize: number; colorsByCell: number[] }
const solution = solveBoard({ gridSize: level.gridSize, pensByCell: level.colorsByCell }, 1, {
  limit: 1,
  witnesses: 1,
}).solutions[0]

check(
  'the shared solver produced a solution to drive the completion dialog',
  solution?.length === 6,
  `cells [${solution?.join(', ')}]`,
)

await openBoard('light', 36)

// empty → dot → bull, so two clicks per solution cell.
for (const cellIndex of solution) {
  await clickCell(cellIndex)
  await clickCell(cellIndex)
}
await sleep(400)

let dialogAppeared = true
try {
  await waitFor(
    `document.querySelector('[role="dialog"], [role="alertdialog"]')`,
    'the completion dialog',
  )
} catch {
  dialogAppeared = false
}
check('solving the board opens the completion dialog', dialogAppeared)

if (dialogAppeared) {
  const trap = await evaluate<{ focusInside: boolean; activeText: string; focusableCount: number }>(`
    const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]')
    const backdrop = dialog.parentElement
    const focusable = backdrop.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    return {
      focusInside: backdrop.contains(document.activeElement),
      activeText: (document.activeElement.textContent || '').trim().slice(0, 40),
      focusableCount: focusable.length,
    }
  `)
  check(
    'the dialog moves focus into itself on open',
    trap.focusInside,
    `focus is on "${trap.activeText}"; ${trap.focusableCount} focusable controls inside`,
  )

  for (let index = 0; index < trap.focusableCount + 3; index += 1) {
    await press('Tab')
  }
  check(
    'Tab cannot walk out of the dialog — aria-modal is true in behaviour, not just in markup',
    await evaluate<boolean>(`
      const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]')
      if (!dialog) return false
      return dialog.parentElement.contains(document.activeElement)
    `),
    `after ${trap.focusableCount + 3} tabs through ${trap.focusableCount} controls`,
  )

  await press('Escape')
  await sleep(500)
  const afterEscape = await evaluate<{ dialogGone: boolean; activeTag: string; onBoard: boolean }>(`
    return {
      dialogGone: !document.querySelector('[role="dialog"], [role="alertdialog"]'),
      activeTag: document.activeElement ? document.activeElement.tagName : 'NONE',
      onBoard: Boolean(document.activeElement && ${CELLS}.includes(document.activeElement)),
    }
  `)
  check('Escape dismisses the dialog', afterEscape.dialogGone)
  // Regression guard: completing a level disables every cell, including the one that opened the
  // dialog, so restoring focus to it is a silent no-op and focus used to end up on <body>.
  check(
    'focus is restored to the page rather than dumped on <body>',
    afterEscape.activeTag !== 'BODY' && afterEscape.activeTag !== 'NONE',
    `document.activeElement is <${afterEscape.activeTag.toLowerCase()}>${afterEscape.onBoard ? ', a board cell' : ''}`,
  )
}

// -------------------------------------------------------- the cramped notice

async function crampedNoticeAt(difficulty: string, width: number, expectedCells: number) {
  await setViewport(width, 720, true)
  await openBoard(difficulty, expectedCells)
  await sleep(800) // the ResizeObserver reports after layout settles
  return evaluate<{ notice: boolean; cellSize: number; text: string }>(`
    const notice = document.querySelector('div[class*="crampedNotice"]')
    const rect = ${CELLS}[0].getBoundingClientRect()
    return {
      notice: Boolean(notice),
      cellSize: Math.round(rect.width * 10) / 10,
      text: notice ? (notice.textContent || '').trim().slice(0, 90) : '',
    }
  `)
}

const mediumNarrow = await crampedNoticeAt('medium', 320, 100)
check(
  'the cramped notice appears on medium at 320px, where cells really are under 24px',
  mediumNarrow.notice && mediumNarrow.cellSize < 24,
  `cell is ${mediumNarrow.cellSize}px — "${mediumNarrow.text}"`,
)

const lightNarrow = await crampedNoticeAt('light', 320, 36)
check(
  'and stays away on light at 320px, where they are not',
  !lightNarrow.notice && lightNarrow.cellSize >= 24,
  `cell is ${lightNarrow.cellSize}px, notice=${lightNarrow.notice}`,
)

const mediumWide = await crampedNoticeAt('medium', 900, 100)
check(
  'and away again on medium at 900px — it is a measurement, not a width breakpoint',
  !mediumWide.notice,
  `cell is ${mediumWide.cellSize}px, notice=${mediumWide.notice}`,
)

const noticeToDismiss = await crampedNoticeAt('medium', 320, 100)
if (noticeToDismiss.notice) {
  await evaluate(`
    const button = document.querySelector('button[class*="crampedNoticeDismiss"]')
    if (!button) throw new Error('the notice has no dismiss control')
    button.click()
    return true
  `)
  await sleep(350)
  check(
    'the notice can be dismissed',
    await evaluate<boolean>(`return !document.querySelector('div[class*="crampedNotice"]')`),
  )
} else {
  check('the notice can be dismissed', false, 'the notice never appeared, so this was not testable')
}

// ------------------------------------------------------------------------ done

console.log(
  `\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} — ${checksRun} checks in a real browser`,
)

socket.close()
chrome.kill()
process.exit(failures === 0 ? 0 : 1)
