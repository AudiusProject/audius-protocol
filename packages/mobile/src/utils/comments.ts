// TODO: do we need hours?
export const formatCommentTrackTimestamp = (timestamp_s: number) => {
  const hours = Math.floor(timestamp_s / (60 * 60))
  const minutes = Math.floor(timestamp_s / 60)
  const seconds = `${timestamp_s % 60}`.padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${minutes}:${seconds}`
  } else {
    return `${minutes}:${seconds}`
  }
}

export const parseCommentTrackTimestamp = (
  formattedTimestamp: string
): number => {
  const parts = formattedTimestamp.split(':').map(Number)
  if (parts.length === 3) {
    // Format is "hours:minutes:seconds"
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  } else if (parts.length === 2) {
    // Format is "minutes:seconds"
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  } else {
    throw new Error('Invalid timestamp format')
  }
}
