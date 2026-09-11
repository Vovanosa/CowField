import type { Difficulty } from '../../game/types'

/**
 * What each `/levels/:difficulty` page says about itself.
 *
 * **These ten pages (five, twice, once per language) are what P18 actually asks Google to rank.**
 * The level grid is the genuine content and the reason the page is not thin, but a grid of numbers
 * says nothing about what the page is, so each one gets a query-first title, a description and two
 * sentences of real copy.
 *
 * Three rules held while writing them, and they are worth keeping if these are ever edited:
 *
 * - **Titles carry the genre's vocabulary, the body carries ours.** People search "star battle
 *   10x10" and "star battle 2 stars"; nobody searches for bulls. So the title says stars and the
 *   copy says bulls, and the `light` page bridges the two once, exactly as `/about` does. Pretending
 *   the product uses different words than it does would be worse than the mismatch.
 * - **Nothing here repeats `/difficulties`.** That page explains what changes *between* sizes; these
 *   explain what one size *is*. Two pages saying the same thing compete with each other, and the one
 *   that loses is usually the one you wanted.
 * - **No sentence is shared across the five.** An earlier draft ended all of them with the same line
 *   about nothing being locked. It was moved out of `body` to stop it looking generated, but it kept
 *   rendering as a paragraph on every one of the five, so it was still the identical-paragraph
 *   pattern with extra steps. **Removed entirely on 2026-09-11**, for the better reason: it was
 *   answering a question no reader has. Nobody looking at a grid of clickable level numbers wonders
 *   whether they are locked, and naming the restriction is what plants the idea that one exists.
 *   Only the navigational links below are shared now, which is boilerplate a crawler expects.
 *
 * Every string is an English literal because English text *is* the key (rule 9) — `uk.ts` carries
 * the counterpart, written natively rather than translated.
 */
export type DifficultyPageContent = {
  /** Query-first, and the page's `<h1>` as well as its `<title>`. Distinct across all five. */
  title: string
  /** 130–160 characters, which is what a search result actually shows. */
  description: string
  /** Two sentences. The first says what the board is, the second says what playing it is like. */
  body: [string, string]
}

export const difficultyPageContent: Record<Difficulty, DifficultyPageContent> = {
  light: {
    title: '6x6 Star Battle puzzles, one star per row',
    description:
      '200 free 6x6 Star Battle puzzles, one star in every row, column and region. The smallest boards on CowField, and the place to work out what the dots do.',
    body: [
      'Light is the smallest size here: every board is 6 by 6, with one bull in every row, every column and every pen. If you know this puzzle as Star Battle or Two Not Touch, the stars are bulls and the regions are pens, and nothing else about it changes.',
      'Thirty-six cells is small enough to hold the whole grid in your head, which is what makes this the right place to find out what the dots are for.',
    ],
  },
  easy: {
    title: '8x8 Star Battle puzzles, one star per row',
    description:
      '200 free 8x8 Star Battle puzzles, one star in every row, column and region. A step up from 6x6, with enough room that the obvious rows run out.',
    body: [
      'Easy keeps one bull in every row, column and pen, and moves the board to 8 by 8. Same rules as the 6x6 boards, with twenty-eight more cells to be wrong in.',
      'This is the size where counting rows stops being enough on its own and you start leaning on the shape of the pens instead.',
    ],
  },
  medium: {
    title: '10x10 Star Battle puzzles, one star per row',
    description:
      '200 free 10x10 Star Battle puzzles, one star in every row, column and region. The size most Star Battle puzzles come in, and the usual place to start.',
    body: [
      'Medium is 10 by 10 with one bull in every row, column and pen. This is the size most Star Battle puzzles come in, so if you have played the game somewhere else it will feel familiar straight away.',
      'A hundred cells is enough that guessing stops paying and you have to eliminate properly, which is the part of this puzzle people come back for.',
    ],
  },
  hard: {
    title: '10x10 Star Battle puzzles, two stars per row',
    description:
      '200 free 10x10 Star Battle puzzles with two stars in every row, column and region. This is what most people mean by Two Not Touch.',
    body: [
      'Hard stays at 10 by 10 and puts two bulls in every row, column and pen. That is a different puzzle from the one-bull boards rather than a bigger one, and it is what most people mean by Two Not Touch.',
      'Finding one bull in a row no longer retires the row, because the second is still out there. The rule that no two bulls may touch ends up doing most of the work.',
    ],
  },
  extreme: {
    title: '15x15 Star Battle puzzles, three stars per row',
    description:
      '200 free 15x15 Star Battle puzzles with three stars in every row, column and region. 225 cells and 45 stars, the hardest boards on CowField.',
    body: [
      'Extreme is 15 by 15 with three bulls in every row, column and pen. That is 225 cells and 45 bulls, and one of these will take a while.',
      'Worth knowing before you start: unlike the smaller sizes, these boards are not checked to have exactly one answer. A few have several, any legal arrangement wins, and you will never be told you found the wrong one.',
    ],
  },
}
