import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

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
  isLongFormContent = false
): string => {
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
  const dayjsFormat = format || 'MM/DD/YY'
  return dayjs(date).format(dayjsFormat)
}

export const formatDateWithTimezoneOffset = (date: string): string => {
  return dayjs.tz(dayjs.utc(date)).format('MM/DD/YY')
}

export const utcToLocalTime = (date: string) => {
  return dayjs.tz(dayjs.utc(date))
}

export const getLocalTimezone = () => {
  return dayjs().format('z')
}
