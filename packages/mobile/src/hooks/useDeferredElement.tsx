import { useState, useCallback } from 'react'

import { InView } from 'react-native-intersection-observer'

/** Hook that provides a ref and inView state for React Native intersection observer.
 * Uses the InView component internally to handle intersection detection.
 */
export const useDeferredElement = (args?: {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  fallbackInView?: boolean
}) => {
  const [inView, setInView] = useState(false)

  const handleChange = useCallback((isInView: boolean) => {
    setInView(isInView)
  }, [])

  const InViewWrapper = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <InView triggerOnce={args?.triggerOnce ?? true} onChange={handleChange}>
          {children}
        </InView>
      )
    },
    [args?.triggerOnce, handleChange]
  )

  return {
    inView,
    InViewWrapper
  }
}
