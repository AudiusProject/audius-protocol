import { Text } from 'components/text'

import {
  DAY_IN_MONTH,
  HR_IN_DAY,
  MIN_IN_HR,
  MONTH_IN_YEAR,
  MS_IN_S,
  S_IN_MIN,
  TimeUnit,
  TimestampProps
} from './types'

const timeUnitMsMap: Record<TimeUnit, number> = {
  m: MS_IN_S * S_IN_MIN,
  h: MS_IN_S * S_IN_MIN * MIN_IN_HR,
  d: MS_IN_S * S_IN_MIN * MIN_IN_HR * HR_IN_DAY,
  mo: MS_IN_S * S_IN_MIN * MIN_IN_HR * HR_IN_DAY * DAY_IN_MONTH,
  y: MS_IN_S * S_IN_MIN * MIN_IN_HR * HR_IN_DAY * DAY_IN_MONTH * MONTH_IN_YEAR
} as const

const getTextFromTime = (time: Date) => {
  const then = new Date(time).getTime()
  const now = Date.now()
  const diff = now - then
  let unit: TimeUnit | null = null

  Object.entries(timeUnitMsMap).forEach(([u, ms]) => {
    if (diff >= ms) {
      unit = u as TimeUnit
    }
  })

  return unit ? `${Math.floor(diff / timeUnitMsMap[unit])}${unit}` : 'just now'
}

export const Timestamp = ({ time }: TimestampProps) => {
  const text = getTextFromTime(time)

  return (
    <Text variant='body' size='xs' color='subdued'>
      {text}
    </Text>
  )
}
