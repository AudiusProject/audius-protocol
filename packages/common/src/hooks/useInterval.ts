import { useEffect, useRef } from 'react'

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)
  const intervalId = useRef<NodeJS.Timer>()

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    // Note: 0 is a valid value for delay.
    if (!delay && delay !== 0) {
      return
    }

    intervalId.current = setInterval(() => savedCallback.current(), delay)

    return () => clearInterval(intervalId.current)
  }, [delay])

  return intervalId.current
}
