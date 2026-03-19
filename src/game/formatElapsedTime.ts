export function formatElapsedTime(totalSeconds: number | null) {
  if (totalSeconds === null) {
    return '--:--'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
