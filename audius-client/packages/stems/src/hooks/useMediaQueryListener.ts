import { useEffect, useState, useCallback } from 'react'

export const useMediaQueryListener = (mediaQuery: string) => {
  // Stores whether there is a match
  const [isMatch, setIsMatch] = useState(false)

  // Updates whether there is a match or not
  // when the media query status changes
  const listener = useCallback(
    matcher => setIsMatch(matcher.matches),
    [setIsMatch]
  )

  // If mediaQuery is set, set up a media query listener
  useEffect(() => {
    if (mediaQuery) {
      const matcher = window.matchMedia(mediaQuery)
      listener(matcher)
      matcher.addListener(listener)
      return () => matcher.removeListener(listener)
    }
    return () => {}
  }, [mediaQuery, listener])

  return { isMatch }
}
