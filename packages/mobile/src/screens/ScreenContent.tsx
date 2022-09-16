import type { ReactNode } from 'react'

import { reachabilitySelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import type { OfflinePlaceholderProps } from 'app/components/offline-placeholder'
import { OfflinePlaceholder } from 'app/components/offline-placeholder'

const { getIsReachable } = reachabilitySelectors

export type ScreenContentProps = OfflinePlaceholderProps & {
  children: ReactNode
}

export const ScreenContent = ({ children, ...other }: ScreenContentProps) => {
  const isNotReachable = useSelector(getIsReachable) === false
  return <>{isNotReachable ? <OfflinePlaceholder {...other} /> : children}</>
}
