import dayjs from 'dayjs'

// TODO: move to common once web/mobile are both up to date
export const formatCommentDate = (dateStr: string) => {
  const now = dayjs()
  const commentDate = dayjs(dateStr)
  const diffInMinutes = Math.min(now.diff(commentDate, 'minute'), 1)
  const diffInHours = now.diff(commentDate, 'hour')
  const diffInDays = now.diff(commentDate, 'day')
  const diffInMonths = now.diff(commentDate, 'month')
  const diffInYears = now.diff(commentDate, 'year')

  if (diffInYears > 0) {
    return `${diffInYears}y`
  } else if (diffInMonths > 0) {
    return `${diffInMonths}mo`
  } else if (diffInDays > 0) {
    return `${diffInDays}d`
  } else if (diffInHours > 0) {
    return `${diffInHours}h`
  } else {
    return `${diffInMinutes}min`
  }
}

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
