import moment from 'moment'
import { Nullable } from 'vitest'

import dayjs from './dayjs'

export const formatToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return `${year}-${month}-${day}`
}

const formatReleaseMessage = (
  releaseDate: string,
  base: string,
  prefixMessage: string
) => {
  const isFutureRelease = moment(releaseDate ?? undefined).isAfter(moment.now())
  let message = isFutureRelease ? '[' + prefixMessage + '] ' : ''
  message += base
  message += isFutureRelease ? ' @ LT' : ''
  return message
}

export const formatCalendarTime = (
  time: Nullable<string>,
  prefixMessage = ''
) => {
  if (!time) {
    return 'Today'
  }

  return (
    moment(time).calendar(undefined, {
      sameDay: formatReleaseMessage(time, '[Today]', prefixMessage),
      nextDay: formatReleaseMessage(time, '[Tomorrow]', prefixMessage),
      nextWeek: formatReleaseMessage(time, 'dddd', prefixMessage),
      lastDay: '[Yesterday]',
      lastWeek: '[Last] dddd',
      sameElse: formatReleaseMessage(time, 'M/D/YYYY', prefixMessage)
    }) + (moment(time).isAfter(moment()) ? ' ' + getLocalTimezone() : '')
  )
}

// DayJs Utils
export const getLocalTimezone = () => {
  return dayjs().format('z')
}

export const formatDate = (date: string, format?: string): string => {
  const dayjsFormat = format || 'M/D/YY'
  return dayjs(date).format(dayjsFormat)
}

export const formatSeconds = (seconds: number): string => {
  const time = dayjs.duration(seconds, 'seconds')
  if (seconds >= 60 * 60) {
    return time.format('H:mm:ss')
  } else {
    return time.format('m:ss')
  }
}
