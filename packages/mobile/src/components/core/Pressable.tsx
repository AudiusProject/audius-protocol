import { useCallback, useRef } from 'react'

import type {
  GestureResponderEvent,
  PressableProps as RNPressableProps
} from 'react-native'
import { Pressable as RNPressable } from 'react-native'

type PressableProps = RNPressableProps

type TouchPosition = { pageX: number; pageY: number }

const scrollThreshold = 2

export const Pressable = (props: PressableProps) => {
  const { onPress, onPressIn, ...other } = props

  const activeTouchPositionRef = useRef<TouchPosition | null>(null)

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent

      activeTouchPositionRef.current = {
        pageX,
        pageY
      }

      onPressIn?.(event)
    },
    [onPressIn]
  )

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!activeTouchPositionRef.current) return

      const { current } = activeTouchPositionRef
      const { pageX, pageY } = event.nativeEvent

      const dx = Math.abs(current.pageX - pageX)
      const dy = Math.abs(current.pageY - pageY)

      const dragged = dx > scrollThreshold || dy > scrollThreshold

      if (!dragged) {
        onPress?.(event)
      }
    },
    [onPress]
  )

  return (
    <RNPressable onPress={handlePress} onPressIn={handlePressIn} {...other} />
  )
}
