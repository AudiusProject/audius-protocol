import { useEffect, useState } from 'react'

import { reachabilitySelectors } from '@audius/common'
import { useSelector } from 'react-redux'
const { getIsReachable } = reachabilitySelectors

type OnBecomeReachable = () => any
type OnBecomeUnreachable = () => any

export const useReachability = (
  onBecomeReachable: OnBecomeReachable | null,
  onBecomeUnreachable: OnBecomeUnreachable | null
) => {
  const isInternetReachable = useSelector(getIsReachable)
  const [lastReachabilityState, setLastReachabilityState] =
    useState(isInternetReachable)

  useEffect(() => {
    if (isInternetReachable !== lastReachabilityState) {
      isInternetReachable ? onBecomeReachable?.() : onBecomeUnreachable?.()
      setLastReachabilityState(isInternetReachable)
    }
  }, [
    isInternetReachable,
    lastReachabilityState,
    onBecomeReachable,
    onBecomeUnreachable
  ])

  return isInternetReachable
}

export const useBecomeReachable = (onBecomeReachable: OnBecomeReachable) => {
  return useReachability(onBecomeReachable, null)
}

export const useBecomeUnreachable = (
  onBecomeUnreachable: OnBecomeUnreachable
) => {
  return useReachability(null, onBecomeUnreachable)
}

export default useReachability
