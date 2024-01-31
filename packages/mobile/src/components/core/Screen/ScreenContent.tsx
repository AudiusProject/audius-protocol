import { reachabilitySelectors } from '@audius/common/store'
import type { ReactNode } from 'react'

import Animated, { FadeIn } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import type { OfflinePlaceholderProps } from 'app/components/offline-placeholder'
import { OfflinePlaceholder } from 'app/components/offline-placeholder'

const { getIsReachable } = reachabilitySelectors

export type ScreenContentProps = OfflinePlaceholderProps & {
  children: ReactNode
  isOfflineCapable?: boolean
}

export const ScreenContent = (props: ScreenContentProps) => {
  const { children, isOfflineCapable, ...other } = props
  const isReachable = useSelector(getIsReachable)
  const wasReachable = usePrevious(isReachable)

  return (
    <>
      {isReachable || isOfflineCapable ? (
        children
      ) : (
        <Animated.View entering={wasReachable ? FadeIn : undefined}>
          <OfflinePlaceholder {...other} />
        </Animated.View>
      )}
    </>
  )
}
