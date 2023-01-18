import { useEffect, useCallback } from 'react'

import { reachabilitySelectors } from '@audius/common'
import { useSelector } from 'react-redux'

type OnBecomeReachable = () => any
type OnBecomeUnreachable = () => any

export const useReachabilityState = (
  onBecomeReachable: OnBecomeReachable | null,
  onBecomeUnreachable: OnBecomeUnreachable | null
) => {
  const currentReachability = useSelector(reachabilitySelectors.getIsReachable)
  const handleReachabilityStateChange = useCallback(
    (nextReachabilityState: boolean) => {
      if (nextReachabilityState && onBecomeReachable) {
        console.info('Become reachable')
        onBecomeReachable()
      }
      if (!nextReachabilityState && onBecomeUnreachable) {
        console.info('Become unreachable')
        onBecomeUnreachable()
      }
    },
    [onBecomeReachable, onBecomeUnreachable]
  )

  useEffect(() => {
    handleReachabilityStateChange(!!currentReachability)
  }, [currentReachability, handleReachabilityStateChange])

  return currentReachability
}

export const useBecomeReachable = (onBecomeReachable: OnBecomeReachable) => {
  return useReachabilityState(onBecomeReachable, null)
}

export const useBecomeUnreachable = (
  onBecomeUnreachable: OnBecomeUnreachable
) => {
  return useReachabilityState(null, onBecomeUnreachable)
}

export default useReachabilityState
