import { useState, useEffect } from 'react'

import dayjs from '../utils/dayjs'

type TimeUnit = {
  value: number
  isSubdued: boolean
}

type TimeLeft = {
  days: TimeUnit
  hours: TimeUnit
  minutes: TimeUnit
  seconds: TimeUnit
} | null

/**
 * Hook that calculates time remaining until a given end date
 * Returns null if the end date has passed.
 * Each time unit includes an isSubdued flag that is true if:
 * 1. For days: the value is 0
 * 2. For hours: days is 0 and hours is 0
 * 3. For minutes: hours is subdued and minutes is 0
 * 4. For seconds: minutes is subdued and seconds is 0
 */
export const useRemixCountdown = (endDate?: string): TimeLeft => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(null)

  useEffect(() => {
    if (!endDate) return

    const calculateTimeLeft = () => {
      const now = dayjs()
      const end = dayjs(endDate)

      if (end.isBefore(now)) {
        setTimeLeft(null)
        return
      }

      // Calculate total days between dates
      const totalDays = end.diff(now, 'days')
      const remainingTime = end.diff(now)
      const duration = dayjs.duration(remainingTime)

      const daysValue = totalDays
      const hoursValue = duration.hours()
      const minutesValue = duration.minutes()
      const secondsValue = duration.seconds()

      // Calculate subdued states based on leading zeros
      const isDaysSubdued = daysValue === 0
      const isHoursSubdued = isDaysSubdued && hoursValue === 0
      const isMinutesSubdued = isHoursSubdued && minutesValue === 0
      const isSecondsSubdued = isMinutesSubdued && secondsValue === 0

      setTimeLeft({
        days: {
          value: daysValue,
          isSubdued: isDaysSubdued
        },
        hours: {
          value: hoursValue,
          isSubdued: isHoursSubdued
        },
        minutes: {
          value: minutesValue,
          isSubdued: isMinutesSubdued
        },
        seconds: {
          value: secondsValue,
          isSubdued: isSecondsSubdued
        }
      })
    }

    calculateTimeLeft()

    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return timeLeft
}
