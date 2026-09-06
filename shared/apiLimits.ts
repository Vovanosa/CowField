/**
 * The numeric bounds of the API contract — one definition, imported by the Zod schemas that reject
 * out-of-range input **and** by the client code that sends it, so the two can never drift apart.
 *
 * This is not game logic and does not belong in `shared/game/`: nothing here affects a rule, a
 * quota or a win condition. These are limits on what a *request* may carry.
 *
 * Every value below is ultimately about one thing: several columns are Postgres `int4`, and Prisma
 * hands them whatever passes validation. A value past `INT4_MAX` reaches the driver and comes back
 * as a 500 rather than a 400 or a 404, and a value that *fits* but is absurd poisons a lifetime
 * counter that only ever grows.
 */

/** Postgres `int4` upper bound. Past this, Prisma raises instead of the query returning nothing. */
export const INT4_MAX = 2_147_483_647

/**
 * The largest time a single completion may claim, in seconds — 24 hours.
 *
 * Generous on purpose: the clock does not pause when the tab is hidden, so a level left open
 * overnight legitimately reports tens of thousands of seconds. It is still a bound, because
 * `total_completion_time_seconds` is a lifetime `increment` and one unbounded request would wedge
 * the column for good. The client clamps to the same ceiling, so a longer run records 24 hours
 * rather than failing to save.
 */
export const MAX_LEVEL_TIME_SECONDS = 86_400

/** The floor, for the same reason: no board can be solved faster than its bulls can be tapped. */
export const MIN_LEVEL_TIME_SECONDS = 1

/**
 * The largest bull-placement batch a single request may report — 100,000.
 *
 * A batch covers one level session: it is reset on completion and on the `pagehide` flush. Even
 * hours of continuous tapping stays orders of magnitude below this; the number exists so the
 * lifetime counter cannot be set to anything it likes in one call.
 */
export const MAX_BULL_PLACEMENTS_PER_REQUEST = 100_000
