export const GRID_SIZE = 10
export const TOTAL_LEVEL_SLOTS = 12

export const COLOR_PALETTE = [
  '#f4ead0',
  '#d8ecc9',
  '#d7e8f8',
  '#eadcf7',
  '#f7dfd0',
  '#f5ebbb',
  '#f9d5de',
  '#dbeadf',
  '#e8d8cc',
  '#d8e0f4',
] as const

export function getColorForId(colorId: number) {
  if (colorId <= 0) {
    return '#f7f0e4'
  }

  return COLOR_PALETTE[colorId - 1] ?? '#f7f0e4'
}
