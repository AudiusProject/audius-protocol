import { useEffect, useRef } from 'react'

/**
 * This function matches what InfiniteScroll expects for getScrollParent.
 */
export const getMainContentScrollRef = () => {
  if (document) {
    return document.getElementById('mainContent')
  }
  return null
}

/**
 * Get a reference to the main content element that we use for scroll effects.
 * This is used for InfiniteScroll and other scroll listeners.
 */
export const useMainContentScrollRef = () => {
  const scrollRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (document && scrollRef.current) {
      scrollRef.current = document.getElementById('mainContent')
    }
  }, [])

  return scrollRef
}
