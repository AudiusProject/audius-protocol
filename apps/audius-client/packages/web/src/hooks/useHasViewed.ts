import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * `useHasViewed` is checks if the reference element has been viewed on the page
 *  by checking the reference object's top against the page scroll
 * @param {number} [pageOffset] Multiplies the window inner height for when to trigger element in view
 */
const useHasViewed = (
  pageOffset = 1
): [boolean, (elementRef: HTMLDivElement) => void] => {
  const [hasViewed, setHasViewed] = useState(false)

  const startAnimation = useRef<HTMLDivElement | null>(null)
  const refInView = useCallback(() => {
    if (startAnimation.current) {
      const refBounding = startAnimation.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const elementTop = refBounding.top + scrollTop
      const windowScrollingBottom = window.innerHeight * pageOffset + scrollTop
      if (elementTop < windowScrollingBottom) {
        setHasViewed(true)
      }
    }
    return false
  }, [pageOffset])

  const setStartAnimation = useCallback(
    (node: HTMLDivElement) => {
      startAnimation.current = node
      refInView()
    },
    [refInView]
  )

  useEffect(() => {
    refInView()
    window.addEventListener('scroll', refInView)
    return () => window.removeEventListener('scroll', refInView)
  }, [refInView])

  return [hasViewed, setStartAnimation]
}

export default useHasViewed
