export const GRID_SIZE = 10
export const TOTAL_LEVEL_SLOTS = 12

export const COLOR_PALETTE = [
  '#f5e2b4',
  '#cfe6b5',
  '#c5d9f2',
  '#d8cef0',
  '#f3c8ba',
  '#f3e6a7',
  '#f4c5d1',
  '#cae3d2',
  '#e8d4c2',
  '#c9d6ef',
] as const

export function getColorForId(colorId: number) {
  if (colorId <= 0) {
    return '#f7f0e4'
  }

  return COLOR_PALETTE[colorId - 1] ?? '#f7f0e4'
}
