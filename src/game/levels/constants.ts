import type { Difficulty } from '../types'

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
  'var(--color-pen-11)',
  'var(--color-pen-12)',
  'var(--color-pen-13)',
  'var(--color-pen-14)',
  'var(--color-pen-15)',
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
  'var(--color-pen-gap-11)',
  'var(--color-pen-gap-12)',
  'var(--color-pen-gap-13)',
  'var(--color-pen-gap-14)',
  'var(--color-pen-gap-15)',
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

/**
 * Every difficulty, in play order.
 *
 * Lives here rather than in a storage module because several of them need it — `levelStorage` and
 * `resources/difficultyOverview` among others — and they already import each other, so putting it in
 * any one of them would make the group circular.
 */
export const DIFFICULTIES: readonly Difficulty[] = ['light', 'easy', 'medium', 'hard', 'extreme']

/**
 * Is this URL segment a difficulty we actually have?
 *
 * **Derived from `DIFFICULTIES`, and deliberately the only copy.** Three pages each carried their own
 * `value === 'light' || value === 'easy' || ...` chain, and when `extreme` was added all three still
 * said no — so `/levels/extreme` rendered "Unknown difficulty." while the route, the API and the
 * database were all perfectly happy. A list that has to be edited in four places is a list that will
 * be edited in three.
 */
export function isDifficulty(value: string | undefined): value is Difficulty {
  return value !== undefined && DIFFICULTIES.includes(value as Difficulty)
}
