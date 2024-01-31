import type { ReactNode } from 'react'

import { reachabilitySelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

const { getIsReachable } = reachabilitySelectors

export type OnlineOnlyProps = {
  children: ReactNode
}

export const OnlineOnly = ({ children }: OnlineOnlyProps) => {
  const isReachable = useSelector(getIsReachable)
  return <>{isReachable ? children : null}</>
}
