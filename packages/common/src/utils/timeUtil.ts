import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR
dayjs.extend(advancedFormat)

export const formatDateWithTimezoneOffset = (date: string): string => {
  return dayjs.utc(date).local().format('M/D/YY')
}

export const formatSeconds = (seconds: number): string => {
  const time = dayjs.duration(seconds, 'seconds')
  if (seconds >= SECONDS_PER_HOUR) {
    return time.format('H:mm:ss')
  } else {
    return time.format('m:ss')
  }
}

export const formatSecondsAsText = (seconds: number): string => {
  const d = dayjs.duration(seconds, 'seconds')
  if (seconds >= SECONDS_PER_HOUR) {
    // Formatting for durations longer than an hour
    return `${d.hours()}h ${d.minutes()}m`
  } else {
    // Formatting for durations shorter than an hour
    return `${d.minutes()}m ${d.seconds()}s`
  }
}

export const formatLineupTileDuration = (
  seconds: number,
  isLongFormContent = false,
  isCollection = false
): string => {
  if (isCollection) {
    return formatSecondsAsText(seconds)
  }
  if (!isLongFormContent && seconds < SECONDS_PER_HOUR) {
    return formatSeconds(seconds)
  }

  const d = dayjs.duration(seconds, 'seconds')
  const hourText = d.hours() > 0 ? `${d.hours()}hr ` : ''
  // Ceiling the minute value
  const minuteText = `${
    d.seconds() > 0 && d.minutes() < 59 ? d.minutes() + 1 : d.minutes()
  }m`

  return `${hourText}${minuteText}`
}

export const formatDate = (date: string, format?: string): string => {
  const dayjsFormat = format || 'M/D/YY'
  return dayjs(date).format(dayjsFormat)
}

export const utcToLocalTime = (date: string) => {
  return dayjs.utc(date).local()
}

export const getLocalTimezone = () => {
  return dayjs().format('z')
}

export const timestampRegex = /(?:([0-9]?\d):)?([0-5]?\d):([0-5]\d)/gm

export const getDurationFromTimestampMatch = (match: RegExpMatchArray) => {
  const h = match[1] ? Number(match[1]) : 0
  const m = match[2] ? Number(match[2]) : 0
  const s = match[3] ? Number(match[3]) : 0
  return s + m * 60 + h * 60 * 60
}
