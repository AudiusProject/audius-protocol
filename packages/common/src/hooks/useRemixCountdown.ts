import { useState, useEffect } from 'react'

import dayjs from 'dayjs'

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
} | null

/**
 * Hook that calculates time remaining until a given end date
 * Returns null if the end date has passed
 */
export const useRemixCountdown = (endDate?: string): TimeLeft => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(null)

  useEffect(() => {
    if (!endDate) return

    const calculateTimeLeft = () => {
      const now = dayjs()
      const end = dayjs(endDate)
      const diff = end.diff(now)

      if (diff <= 0) {
        setTimeLeft(null)
        return
      }

      const duration = dayjs.duration(diff)
      setTimeLeft({
        days: duration.days(),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds()
      })
    }

    calculateTimeLeft()

    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return timeLeft
}
