import type { ReactNode } from 'react'

import { Flex } from '@audius/harmony-native'

type Props = {
  children: ReactNode
  onLayout: (e: any) => void
  isVisible: boolean
}

/**
 * Common wrapper component for tab content that handles layout and visibility.
 * Used to wrap content in tab views to handle animations and layout measurements.
 */
export const TabBody = ({ children, onLayout, isVisible }: Props) => {
  return (
    <Flex
      w='100%'
      flex={1}
      onLayout={onLayout}
      style={{
        position: isVisible ? 'relative' : 'absolute'
      }}
    >
      {children}
    </Flex>
  )
}
