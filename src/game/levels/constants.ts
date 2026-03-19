export const GRID_SIZE = 10
export const TOTAL_LEVEL_SLOTS = 12

export const COLOR_PALETTE = [
  'var(--color-pen-1)',
  'var(--color-pen-2)',
  'var(--color-pen-3)',
  'var(--color-pen-4)',
  'var(--color-pen-5)',
  'var(--color-pen-6)',
  'var(--color-pen-7)',
  'var(--color-pen-8)',
  'var(--color-pen-9)',
  'var(--color-pen-10)',
] as const

export const COLOR_GAP_PALETTE = [
  'var(--color-pen-gap-1)',
  'var(--color-pen-gap-2)',
  'var(--color-pen-gap-3)',
  'var(--color-pen-gap-4)',
  'var(--color-pen-gap-5)',
  'var(--color-pen-gap-6)',
  'var(--color-pen-gap-7)',
  'var(--color-pen-gap-8)',
  'var(--color-pen-gap-9)',
  'var(--color-pen-gap-10)',
] as const

export function getColorForId(colorId: number) {
  if (colorId <= 0) {
    return 'var(--color-board-empty-cell)'
  }

  return COLOR_PALETTE[colorId - 1] ?? 'var(--color-board-empty-cell)'
}

export function getGapColorForId(colorId: number) {
  if (colorId <= 0) {
    return 'var(--color-board-gap)'
  }

  return COLOR_GAP_PALETTE[colorId - 1] ?? 'var(--color-board-gap)'
}
