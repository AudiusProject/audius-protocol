import moment, { MomentInput } from 'moment'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR

export const formatSeconds = (seconds: number): string => {
  const utc = moment.utc(moment.duration(seconds, 'seconds').asMilliseconds())
  if (seconds > SECONDS_PER_HOUR) {
    return utc.format('h:mm:ss')
  }
  return utc.format('m:ss')
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
  isPodcast = false
) => {
  if (!isPodcast && seconds < SECONDS_PER_HOUR) return formatSeconds(seconds)
  const d = moment.duration(seconds, 'seconds')
  const hourText = d.hours() > 0 ? `${d.hours()}hr ` : ''
  return `${hourText}${d.minutes()}m`
}

export const formatDate = (date: MomentInput, format?: string): string => {
  return moment(date, format).format('MM/DD/YY')
}

export const formatDateWithTimezoneOffset = (date: MomentInput): string => {
  return moment(date).add(moment().utcOffset(), 'm').format('MM/DD/YY')
}
