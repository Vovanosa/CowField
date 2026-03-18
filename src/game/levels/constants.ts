export const GRID_SIZE = 10
export const TOTAL_LEVEL_SLOTS = 12

export const COLOR_PALETTE = [
  '#dcecbf',
  '#f8b9af',
  '#ffe6a8',
  '#cbc7ef',
  '#a9c5e9',
  '#99d4e8',
  '#bee2c0',
  '#a9acec',
  '#f2deef',
  '#f6c1ce',
] as const

export function getColorForId(colorId: number) {
  if (colorId <= 0) {
    return '#f7f0e4'
  }

  return COLOR_PALETTE[colorId - 1] ?? '#f7f0e4'
}
