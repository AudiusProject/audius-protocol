import moment from 'moment'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR

export const formatSeconds = (seconds: number) => {
  const utc = moment.utc(moment.duration(seconds, 'seconds').asMilliseconds())
  if (seconds > SECONDS_PER_HOUR) {
    return utc.format('h:mm:ss')
  }
  return utc.format('m:ss')
}

export const formatSecondsAsText = (duration: number) => {
  const d = moment.duration(duration, 'seconds')
  if (duration > 60 * 60) {
    return `${d.hours()}h ${d.minutes()}m`
  }
  return `${d.minutes()}m ${d.seconds()}s`
}

export const formatDate = (date: string, parseFormat?: string) => {
  if (parseFormat) {
    return moment(date, parseFormat).format('MM/DD/YY')
  }
  return moment(date).format('MM/DD/YY')
}