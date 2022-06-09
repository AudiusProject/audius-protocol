import { useEffect, useState, useCallback } from 'react'

export const useCollapsibleText = (widthToHideText?: number) => {
  // Stores whether text should be hidden
  const [textIsHidden, setTextIsHidden] = useState(false)

  // Hides the text based on the matching of a `matchMedia` call
  const hideText = useCallback(
    matcher => {
      if (matcher.matches) {
        setTextIsHidden(true)
      } else {
        setTextIsHidden(false)
      }
    },
    [setTextIsHidden]
  )

  // If `widthToHideText` is set, set up a media query listener
  useEffect(() => {
    if (widthToHideText) {
      const match = window.matchMedia(`(max-width: ${widthToHideText}px)`)
      hideText(match)
      match.addListener(hideText)
      return () => match.removeListener(hideText)
    }
    return () => {}
  }, [widthToHideText, hideText])

  return {
    textIsHidden
  }
}
