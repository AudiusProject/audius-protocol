import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Hook that manages delayed hover state
 *
 * @param delay Delay in seconds before setting hovered state to true
 * @returns Object containing hover state and handlers
 */
export const useHoverDelay = (delay = 0.5) => {
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    clearTimer()

    // Convert seconds to milliseconds
    const delayMs = delay * 1000

    timerRef.current = setTimeout(() => {
      setIsHovered(true)
    }, delayMs)
  }, [delay, clearTimer])

  const handleMouseLeave = useCallback(() => {
    clearTimer()
    setIsHovered(false)
  }, [clearTimer])

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    clearTimer,
    setIsHovered
  }
}
