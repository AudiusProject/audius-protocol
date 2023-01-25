import { useEffect, useCallback } from 'react'

import { reachabilitySelectors } from '@audius/common'
import { useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

type OnBecomeReachable = () => any
type OnBecomeUnreachable = () => any

const { getIsReachable } = reachabilitySelectors

export const useReachabilityState = (
  onBecomeReachable: OnBecomeReachable | null,
  onBecomeUnreachable: OnBecomeUnreachable | null
) => {
  const currentReachability = useSelector(getIsReachable)
  const prevReachability = usePrevious(currentReachability)

  const handleReachabilityStateChange = useCallback(
    (nextReachabilityState: boolean) => {
      if (nextReachabilityState && !prevReachability && onBecomeReachable) {
        console.info('Become reachable')
        onBecomeReachable()
      }
      if (!nextReachabilityState && prevReachability && onBecomeUnreachable) {
        console.info('Become unreachable')
        onBecomeUnreachable()
      }
    },
    [onBecomeReachable, onBecomeUnreachable, prevReachability]
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
