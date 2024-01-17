import { useEffect, useRef } from 'react'

import { Animated } from 'react-native'

import type { IconProps } from '@audius/harmony-native'
import { IconCaretDown } from '@audius/harmony-native'

const springToValue = ({
  animation,
  value
}: {
  animation: Animated.Value
  value: number
}) => {
  Animated.spring(animation, {
    toValue: value,
    tension: 160,
    friction: 15,
    useNativeDriver: true
  }).start()
}

type ExpandableArrowIconProps = {
  expanded: boolean
  iconSize?: IconProps['size']
}

/**
 * Arrow/caret to be used in conjunction with Expandable that
 * rotates when expanded.
 *
 * @param expanded whether the arrow and content is expanded
 * @param iconSize size of the arrow
 */
export const ExpandableArrowIcon = ({
  expanded,
  iconSize = 'm' as IconProps['size']
}: ExpandableArrowIconProps) => {
  const rotateAnim = useRef(new Animated.Value(0))

  useEffect(() => {
    springToValue({
      animation: rotateAnim.current,
      value: expanded ? 180 : 0
    })
  }, [expanded])

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: rotateAnim.current.interpolate({
              inputRange: [0, 180],
              outputRange: ['0deg', '-180deg']
            })
          }
        ]
      }}
    >
      <IconCaretDown size={iconSize} color='default' />
    </Animated.View>
  )
}
