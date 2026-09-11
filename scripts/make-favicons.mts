/**
 * Rasterises `public/favicon.svg` into the icon files browsers and crawlers actually ask for.
 *
 * Writes `public/favicon.ico` (16, 32 and 48 in one file) and `public/apple-touch-icon.png` (180).
 * `favicon.svg` is the source of truth — edit that and re-run `npm run icons`; never hand-edit the
 * output.
 *
 * **Why 48 is in there.** Google's favicon crawler wants a square icon at 48px or a multiple of it,
 * and it is the size that ends up beside a search result. 16 and 32 are the browser tab at 1x and 2x.
 *
 * **Why ICO at all, when the SVG is linked first.** Every current browser takes the SVG, but Google
 * has historically been unreliable about SVG favicons, and an ICO costs a few KB to remove the doubt
 * entirely. The link order in `index.html` means a browser that understands SVG never fetches it.
 *
 * No new dependency: Chrome does the rasterising over CDP (the `capture-og-image.mts` pattern) and
 * the ICO container is 6 bytes of header plus 16 per entry, written here by hand. PNG-inside-ICO has
 * been valid since Windows Vista and is what every icon generator emits now.
 *
 * Needs Chrome (or Edge) on the machine; set CHROME_PATH if it is somewhere unusual. Nothing else
 * has to be running — the SVG is rendered from a data: URL, not from the dev server.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SOURCE = new URL('../public/favicon.svg', import.meta.url).pathname.replace(/^\//, '')
const ICO_OUTPUT = new URL('../public/favicon.ico', import.meta.url).pathname.replace(/^\//, '')
const APPLE_OUTPUT = new URL('../public/apple-touch-icon.png', import.meta.url).pathname.replace(
  /^\//,
  '',
)

/** The sizes that go inside favicon.ico: tab at 1x, tab at 2x, and the one Google reads. */
const ICO_SIZES = [16, 32, 48]
/** iOS home screen. 180 is the current iPhone size and downscales cleanly for the rest. */
const APPLE_SIZE = 180

const DEBUG_PORT = Number(process.env.DEBUG_PORT ?? 9355)

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((path): path is string => Boolean(path))

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

if (!existsSync(SOURCE)) {
  console.error(`\nMissing ${SOURCE} — that file is the source of truth for every icon.\n`)
  process.exit(2)
}

const svg = readFileSync(SOURCE, 'utf8')

const chromePath = CHROME_CANDIDATES.find((path) => existsSync(path))
if (!chromePath) {
  console.error('\nNo Chrome or Edge found. Set CHROME_PATH.\n')
  process.exit(2)
}

const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cowfield-icons-'))}`,
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
      /* still starting */
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

type Pending = { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void }

let nextMessageId = 1
const pending = new Map<number, Pending>()
const eventWaiters: { method: string; resolve: () => void }[] = []

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data)) as {
    id?: number
    method?: string
    error?: unknown
    result?: Record<string, unknown>
  }

  if (message.id && pending.has(message.id)) {
    const entry = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) entry?.reject(new Error(JSON.stringify(message.error)))
    else entry?.resolve(message.result ?? {})
    return
  }

  if (message.method) {
    for (let index = eventWaiters.length - 1; index >= 0; index -= 1) {
      if (eventWaiters[index].method === message.method) eventWaiters.splice(index, 1)[0].resolve()
    }
  }
})

function send(method: string, params: Record<string, unknown> = {}) {
  const id = nextMessageId
  nextMessageId += 1
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise<Record<string, unknown>>((resolve, reject) => pending.set(id, { resolve, reject }))
}

function waitForEvent(method: string, timeoutMs = 20000) {
  return new Promise<void>((resolve, reject) => {
    eventWaiters.push({ method, resolve })
    setTimeout(() => reject(new Error(`timed out waiting for ${method}`)), timeoutMs)
  })
}

await send('Page.enable')
await send('Runtime.enable')

async function evaluate<T>(body: string): Promise<T> {
  const result = (await send('Runtime.evaluate', {
    expression: `(() => { ${body} })()`,
    returnByValue: true,
  })) as { result?: { value?: T }; exceptionDetails?: { exception?: { description?: string } } }
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'evaluate threw')
  }
  return result.result?.value as T
}

/**
 * Refuses to build from an SVG that a browser would reject as a standalone file.
 *
 * This exists because of a bug that shipped right up to the last check: a CSS custom property name
 * written in a comment put a double hyphen inside it, which XML forbids, and **a standalone `.svg`
 * is parsed as strict XML**. Chrome rejected the whole file — no icon at all.
 *
 * What makes it worth a guard rather than a note is that nothing else catches it. The build passes,
 * `check:seo` passes, the file serves 200 with the right content type, and it renders perfectly in
 * any HTML page you paste it into, because inline SVG goes through the lenient *HTML* parser. The
 * only way to see the failure is to parse it the way the browser does when it is its own document.
 *
 * The test is to **navigate to the SVG as its own document**, which is not a simulation of the
 * failure but the thing itself. On success the root element is `svg`; on a parse error Chrome
 * replaces the document with an error page carrying a `parsererror`. (`DOMParser` would be the
 * obvious tool and does not work here — Trusted Types on the initial page rejects
 * `parseFromString`.)
 */
async function assertStandaloneSvgParses() {
  const loaded = waitForEvent('Page.loadEventFired')
  await send('Page.navigate', {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  })
  await loaded
  await sleep(120)

  const report = await evaluate<{ root: string; error: string }>(`
    const failure = document.querySelector('parsererror')
    return {
      root: document.documentElement ? document.documentElement.tagName.toLowerCase() : '(none)',
      error: failure ? failure.textContent.replace(/\\s+/g, ' ').trim().slice(0, 300) : '',
    }
  `)

  if (report.root !== 'svg' || report.error) {
    console.error(`\n${SOURCE} is not valid XML, so a browser will not render it as a favicon.`)
    console.error(`Root element parsed as <${report.root}>, expected <svg>.\n`)
    if (report.error) console.error(`  ${report.error}\n`)
    console.error('If that mentions a comment, check for a double hyphen inside one — XML forbids it.\n')
    socket.close()
    chrome.kill()
    process.exit(1)
  }

  console.log(`${SOURCE} parses as a standalone document`)
}

await assertStandaloneSvgParses()

/**
 * Renders the SVG at exactly `size` x `size` device pixels and returns the PNG.
 *
 * The SVG is scaled by the wrapper's width/height rather than by a screenshot `scale`, so Chrome
 * rasterises the vector *at* the target size instead of resampling a larger bitmap down. That is the
 * whole reason this produces a crisp 16px icon and an image editor's downscale does not.
 */
async function render(size: number): Promise<Buffer> {
  const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:0">
    <div style="width:${size}px;height:${size}px">${svg.replace(
      /<svg width="64" height="64"/,
      '<svg width="100%" height="100%"',
    )}</div>`

  const loaded = waitForEvent('Page.loadEventFired')
  await send('Page.navigate', { url: `data:text/html;charset=utf-8,${encodeURIComponent(page)}` })
  await loaded

  await send('Emulation.setDeviceMetricsOverride', {
    width: size,
    height: size,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await sleep(120)

  const shot = (await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
  })) as { data: string }

  return Buffer.from(shot.data, 'base64')
}

/**
 * Packs PNGs into an ICO container.
 *
 * Layout: a 6-byte ICONDIR, then one 16-byte ICONDIRENTRY per image, then the PNG payloads. A
 * dimension of 256 is stored as 0, which is why the byte is `size % 256` rather than `size` — not
 * reachable with the sizes above, but wrong is wrong and it costs one character.
 */
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries: Buffer[] = []

  for (const { size, png } of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size % 256, 0) // width
    entry.writeUInt8(size % 256, 1) // height
    entry.writeUInt8(0, 2) // palette size, 0 for true colour
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += png.length
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)])
}

const icoImages: { size: number; png: Buffer }[] = []
for (const size of ICO_SIZES) {
  icoImages.push({ size, png: await render(size) })
}

const ico = buildIco(icoImages)
writeFileSync(ICO_OUTPUT, ico)
console.log(
  `Wrote ${ICO_OUTPUT} — ${ICO_SIZES.join(', ')}px, ${ico.length} bytes ` +
    `(${icoImages.map((image) => `${image.size}:${image.png.length}B`).join(' ')})`,
)

const apple = await render(APPLE_SIZE)
writeFileSync(APPLE_OUTPUT, apple)
console.log(`Wrote ${APPLE_OUTPUT} — ${APPLE_SIZE}px, ${apple.length} bytes`)

/*
  `/Cow.svg` was the icon URL until 2026-09-11 and nothing in the app links it any more. It is kept,
  and kept in step with the real icon, rather than deleted: Google's favicon crawler caches the
  *location* and refetches it on its own schedule, independent of when it re-reads the HTML. Deleting
  the file would 404 that cached fetch and leave the generic globe up for longer — which is the exact
  complaint this change exists to fix. Rewriting it costs nothing and means any stale reference,
  anywhere, resolves to the current art.

  Safe to delete once Search Console shows the new icon. Delete the file and this block together.
*/
const LEGACY_OUTPUT = new URL('../public/Cow.svg', import.meta.url).pathname.replace(/^\//, '')
writeFileSync(LEGACY_OUTPUT, svg)
console.log(`Wrote ${LEGACY_OUTPUT} — transitional alias, same art as favicon.svg`)

socket.close()
chrome.kill()
