import { useEffect } from 'react'

/**
 * Scrolls to top when the component mounts or optionally when
 * `trigger` changes to true
 */
const useScrollToTop = (trigger = true) => {
  useEffect(() => {
    if (trigger && window && window.scrollTo) {
      window.scrollTo(0, 0)
    }
  }, [trigger])
}

export default useScrollToTop
