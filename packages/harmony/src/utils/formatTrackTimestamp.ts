/**
 * Pretty formats a track timestamp.
 * Ex. input 65 -> output 1:05
 */
export const formatTrackTimestamp = (timestampSecs: number) => {
  const hours = Math.floor(timestampSecs / (60 * 60))
  const minutes = Math.floor((timestampSecs / 60) % 60)
  const seconds = `${Math.floor(timestampSecs) % 60}`.padStart(2, '0')
  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, '0')
    return `${hours}:${paddedMinutes}:${seconds}`
  } else {
    return `${minutes}:${seconds}`
  }
}
