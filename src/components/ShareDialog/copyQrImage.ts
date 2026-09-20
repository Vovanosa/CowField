/** How many pixels square the copied PNG is. Big enough to stay sharp when pasted and resized. */
const COPIED_IMAGE_SIZE = 640

/**
 * Whether this browser can put an image on the clipboard at all.
 *
 * `navigator.clipboard.writeText` is near-universal; `write` with a `ClipboardItem` is not, and a
 * button that silently does nothing is worse than no button. Checked once at render, and the control
 * is simply absent where it would not work.
 */
export function canCopyImages() {
  return (
    typeof window !== 'undefined' &&
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  )
}

/**
 * Rasterises the live QR `<svg>` to a PNG.
 *
 * **The node is cloned and given explicit `width`/`height` first.** It is sized by CSS on the page
 * and carries only a `viewBox`, and an SVG with no intrinsic size fails to load as an `Image` in
 * several browsers — it decodes to nothing, with no error worth reading.
 *
 * It also relies on every fill and stroke being an inline attribute rather than a CSS Module class,
 * which is why `QrCode` paints that way. Serialising a class-styled node produces a black square.
 */
async function renderQrPng(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(COPIED_IMAGE_SIZE))
  clone.setAttribute('height', String(COPIED_IMAGE_SIZE))
  clone.removeAttribute('class')

  const source = new XMLSerializer().serializeToString(clone)
  const svgUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }))

  try {
    const image = new Image()
    image.width = COPIED_IMAGE_SIZE
    image.height = COPIED_IMAGE_SIZE

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('The QR code could not be rasterised.'))
      image.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = COPIED_IMAGE_SIZE
    canvas.height = COPIED_IMAGE_SIZE

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('No 2D canvas context.')
    }

    /*
      Paint white underneath before drawing. The SVG's own plate covers the whole viewBox, so this
      only matters at the rounded corners — but a PNG with transparent corners pasted onto a dark
      background gets four dark notches cut out of the quiet zone, and the quiet zone is the part
      scanners need most.
    */
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, COPIED_IMAGE_SIZE, COPIED_IMAGE_SIZE)
    context.drawImage(image, 0, 0, COPIED_IMAGE_SIZE, COPIED_IMAGE_SIZE)

    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))

    if (!png) {
      throw new Error('The QR code could not be encoded as a PNG.')
    }

    return png
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

/**
 * Puts the QR code on the clipboard as a PNG, ready for a paste into a chat or a document.
 *
 * **`ClipboardItem` is constructed with the pending promise rather than an awaited blob**, which
 * looks redundant and is not: Safari only honours a clipboard write that begins inside the user
 * gesture that triggered it, and awaiting the rasterisation first ends the gesture. Passing the
 * promise starts the write immediately and lets the image arrive late.
 *
 * PNG rather than SVG because PNG is the format other applications actually accept on paste.
 */
export async function copyQrImageToClipboard(svg: SVGSVGElement) {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': renderQrPng(svg) })])
}
