function padTwo(value: number) {
  return String(value).padStart(2, '0')
}

/**
 * A duration in seconds as `mm:ss`, or `h:mm:ss` once it passes an hour.
 *
 * The hour segment is not cosmetic. This renders the *lifetime* total on the Statistics page as
 * well as a single level's time, and without it ten hours of play read as `600:23` — a number that
 * looks like a bug rather than a total.
 *
 * The segment only appears when it is needed, so an ordinary level time stays the familiar two
 * fields wide and nothing on the game screen shifts.
 */
export function formatElapsedTime(totalSeconds: number | null) {
  if (totalSeconds === null || !Number.isFinite(totalSeconds)) {
    return '--:--'
  }

  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours}:${padTwo(minutes)}:${padTwo(seconds)}`
  }

  return `${padTwo(minutes)}:${padTwo(seconds)}`
}
