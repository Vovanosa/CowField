import type { Difficulty } from '../../../shared/game'

/**
 * How many solutions a level of each difficulty may have and still be saved.
 *
 * **One, everywhere except `extreme`.** A puzzle with a single solution is solvable by pure
 * deduction, which is the whole point, and the four original difficulties reach it in milliseconds.
 *
 * `extreme` cannot. At 15x15 with three bulls per row, column and pen the repair loop drives a board
 * into the low tens and then stalls; nothing reached a single solution in any budget tried. The
 * levels are still playable and still validated from the rules rather than a stored answer
 * (universal rule 4), so any legal arrangement the player finds wins. What is lost is the guarantee
 * that deduction alone always suffices — a level with several solutions can reach a point where the
 * player has to pick. That trade was made deliberately, the alternative being no `extreme` at all.
 *
 * **This is the dial.** Lower means better puzzles and slower generation; the observed counts at 60
 * sit between 3 and 22, well under the cap, because a rejected board costs about a second to
 * replace and the generator simply tries again.
 *
 * Shared by `levels:generate` and `levels:fill` so a batch and a top-up cannot apply different
 * standards to the same library.
 */
export const MAX_SOLUTIONS_BY_DIFFICULTY: Record<Difficulty, number> = {
  light: 1,
  easy: 1,
  medium: 1,
  hard: 1,
  extreme: 60,
}
