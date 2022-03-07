import { Animated, GestureResponderEvent } from 'react-native'

export const attachToDx = (animation: Animated.Value, newValue: number) => (
  e: GestureResponderEvent
) => {
  Animated.event(
    [
      null,
      {
        dx: animation
      }
    ],
    { useNativeDriver: false }
  )(e, { dx: newValue })
}

export const attachToDy = (animation: Animated.Value, newValue: number) => (
  e: GestureResponderEvent
) => {
  Animated.event(
    [
      null,
      {
        dy: animation
      }
    ],
    { useNativeDriver: false }
  )(e, { dy: newValue })
}
