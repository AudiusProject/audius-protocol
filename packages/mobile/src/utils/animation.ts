import {
  Animated,
  GestureResponderEvent,
  NativeScrollEvent
} from 'react-native'

export const attachToDx =
  (animation: Animated.Value, newValue: number) =>
  (e: GestureResponderEvent) => {
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

export const attachToDy =
  (animation: Animated.Value, newValue: number) =>
  (e: GestureResponderEvent) => {
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

/**
 * Attaches an animated value to an onScroll.
 * ```
 * const animation = useRef(new Animated.Value(0)).current
 * <List
 *  onScroll={attachToScroll(animation)}
 * />
 * ```
 * Note that we cannot set a custom onScroll and use this animated event
 * or we do not get the ability to useNativeDriver.
 * If you wish to add custom scroll functionality and attach an animation,
 * native driver cannot be used.
 */
export const attachToScroll = (
  animation: Animated.Value,
  config?: Partial<Animated.EventConfig<NativeScrollEvent>>
) =>
  Animated.event([{ nativeEvent: { contentOffset: { y: animation } } }], {
    useNativeDriver: true,
    ...config
  })
