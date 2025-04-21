import { useEffect, useState, useCallback } from 'react'

export const useMediaQueryListener = (mediaQuery: string) => {
  // Stores whether there is a match
  const [isMatch, setIsMatch] = useState(false)

  // Updates whether there is a match or not
  // when the media query status changes
  const listener = useCallback(
    (event: MediaQueryListEvent) => setIsMatch(event.matches),
    [setIsMatch]
  )

  // If mediaQuery is set, set up a media query listener
  useEffect(() => {
    if (mediaQuery) {
      const matcher = window.matchMedia(mediaQuery)
      // Set initial value
      setIsMatch(matcher.matches)
      // Use modern event listener API
      matcher.addEventListener('change', listener)
      return () => matcher.removeEventListener('change', listener)
    }
    return () => {}
  }, [mediaQuery, listener])

  return { isMatch }
}
