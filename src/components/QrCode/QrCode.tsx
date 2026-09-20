import { useMemo, type CSSProperties, type Ref } from 'react'

import { encodeQrCode } from '../../lib/qrCode'
import { CowIcon } from '../icons'
import styles from './QrCode.module.css'

type QrCodeProps = {
  /** What the code resolves to when scanned. */
  value: string
  /** Describes the code to a screen reader; the URL itself is offered as text beside it. */
  label: string
  className?: string
  /** For copying the code as an image — see `ShareDialog`. */
  ref?: Ref<SVGSVGElement>
}

/** Modules of empty margin. Four is the specification's minimum and scanners genuinely need it. */
const QUIET_ZONE = 4

/*
  **Paint is inline, not in the CSS Module, and that is load-bearing.**

  Two reasons, and the first is the one that matters. A CSS Module class only means anything inside
  the document that loaded the stylesheet — serialise this node to copy it as an image and every
  class goes with it, leaving an unstyled, uniformly black square that is not a QR code at all.
  Inline attributes travel. `ShareDialog` depends on it.

  The second is that these colours are deliberately not themed. A scanner wants strong dark-on-light
  whichever theme the page is in, so there was never a token to reference here: a code that inverted
  in dark mode would look right and read badly. The cow's three are the same in both themes
  (`colors.css`), so restating them changes nothing about how it looks.
*/
const PLATE = '#ffffff'
const INK = '#1c1917'

/** Set as custom properties so `CowIcon`'s own `var()` references resolve after serialisation. */
const COW_PAINT = {
  '--color-cow-fill': '#fffaf4',
  '--color-cow-stroke': '#7e4f47',
  '--color-cow-accent': '#e9b0bb',
} as CSSProperties

/**
 * The share QR: rounded dots, square eyes, and the cow in the middle.
 *
 * **The cow is affordable because the encoder uses error-correction level H.** It covers a square of
 * roughly 7×7 modules — about 6% of a 33×33 symbol against the ~30% H recovers — so the modules it
 * hides are reconstructed from parity. The block interleave is what makes that true: the loss is
 * spread across every block instead of destroying one.
 */
export function QrCode({ value, label, className, ref }: QrCodeProps) {
  const code = useMemo(() => encodeQrCode(value), [value])
  const { size, modules } = code

  const extent = size + QUIET_ZONE * 2

  /*
    An odd-sided square in the middle, kept clear for the logo. Odd so it centres exactly on the
    symbol's own centre module; scaled to the version so it stays proportionate as the URL grows
    rather than eating an ever-larger share of a small code.
  */
  const logoSpan = Math.max(5, Math.floor(size * 0.22) | 1)
  const logoStart = Math.floor((size - logoSpan) / 2)
  const logoEnd = logoStart + logoSpan

  const isInsideLogo = (row: number, column: number) =>
    row >= logoStart && row < logoEnd && column >= logoStart && column < logoEnd

  /** The three 7×7 eyes, which are drawn as whole shapes rather than as dots. */
  const isInsideFinder = (row: number, column: number) =>
    (row < 7 && column < 7) || (row < 7 && column >= size - 7) || (row >= size - 7 && column < 7)

  const dots: string[] = []
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (!modules[row][column] || isInsideFinder(row, column) || isInsideLogo(row, column)) {
        continue
      }
      dots.push(`${row},${column}`)
    }
  }

  const finderOrigins: [number, number][] = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]

  return (
    <svg
      ref={ref}
      className={`${styles.code}${className ? ` ${className}` : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${extent} ${extent}`}
      role="img"
      aria-label={label}
      shapeRendering="geometricPrecision"
    >
      <rect x="0" y="0" width={extent} height={extent} rx="3" fill={PLATE} />

      <g transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`}>
        {dots.map((key) => {
          const [row, column] = key.split(',').map(Number)

          return (
            <rect
              key={key}
              // A hair under a full module on each side, so neighbouring dots read as separate
              // rounded squares rather than merging into bars.
              x={column + 0.08}
              y={row + 0.08}
              width={0.84}
              height={0.84}
              rx={0.34}
              fill={INK}
            />
          )
        })}

        {finderOrigins.map(([row, column]) => (
          <g key={`finder-${row}-${column}`}>
            {/* The ring, as a stroked square: one shape instead of sixteen dots. */}
            <rect
              x={column + 0.5}
              y={row + 0.5}
              width={6}
              height={6}
              rx={1.9}
              fill="none"
              stroke={INK}
              strokeWidth={1}
            />
            <rect x={column + 2} y={row + 2} width={3} height={3} rx={1} fill={INK} />
          </g>
        ))}

        {/* The plate under the cow: covers the cleared modules so the edge reads as intentional. */}
        <rect
          x={logoStart - 0.35}
          y={logoStart - 0.35}
          width={logoSpan + 0.7}
          height={logoSpan + 0.7}
          rx={1.6}
          fill={PLATE}
        />
        <g style={COW_PAINT}>
          <CowIcon
            x={logoStart + 0.5}
            y={logoStart + 0.5}
            width={logoSpan - 1}
            height={logoSpan - 1}
          />
        </g>
      </g>
    </svg>
  )
}
