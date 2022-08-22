import { useCallback, useEffect, useState } from 'react'

/** Returns whether the given media query is matched */
export const useMatchesBreakpoint = ({
  mediaQuery,
  initialValue = false
}: {
  /**
   * E.g. the return value of something like `window.matchMedia("(max-width: 900px)")`
   */
  mediaQuery: MediaQueryList
  initialValue?: boolean
}) => {
  const [value, setValue] = useState(initialValue)
  const handleChange = useCallback(() => {
    setValue(mediaQuery.matches)
  }, [mediaQuery])

  useEffect(() => {
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [handleChange, mediaQuery])

  return value
}
