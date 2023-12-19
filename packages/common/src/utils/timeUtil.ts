import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'
import type { MomentInput } from 'moment-timezone'
import moment from 'moment-timezone'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

export const formatSeconds = (seconds: number): string => {
  const time = moment.utc(moment.duration(seconds, 'seconds').asMilliseconds())
  if (seconds > SECONDS_PER_HOUR) {
    return time.format('h:mm:ss')
  }
  return time.format('m:ss')
}

export const formatSecondsAsText = (seconds: number): string => {
  const d = moment.duration(seconds, 'seconds')
  if (seconds > SECONDS_PER_HOUR) {
    return `${d.hours()}h ${d.minutes()}m`
  }
  return `${d.minutes()}m ${d.seconds()}s`
}

export const formatLineupTileDuration = (
  seconds: number,
  isLongFormContent = false
) => {
  if (!isLongFormContent && seconds < SECONDS_PER_HOUR) {
    return formatSeconds(seconds)
  }
  const d = moment.duration(seconds, 'seconds')
  const hourText = d.hours() > 0 ? `${d.hours()}hr ` : ''
  // Ceiling the minute value
  const minuteText = `${
    d.seconds() > 0 && d.minutes() < 59 ? d.minutes() + 1 : d.minutes()
  }m`

  return `${hourText}${minuteText}`
}

export const formatDate = (date: MomentInput, format?: string): string => {
  return moment(date, format).format('MM/DD/YY')
}

export const formatDateWithTimezoneOffset = (date: MomentInput): string => {
  return moment(date).add(moment().utcOffset(), 'm').format('MM/DD/YY')
}

export const utcToLocalTime = (date: string) => {
  return dayjs.utc(date).local()
}

export const getLocalTimezone = () => {
  return dayjs().format('z')
}
