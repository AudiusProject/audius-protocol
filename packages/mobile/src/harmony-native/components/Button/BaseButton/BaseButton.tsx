import { useCallback, useState } from 'react'

import styled from '@emotion/native'
import type { LayoutChangeEvent } from 'react-native'
import { Pressable } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import LoadingSpinner from 'app/components/loading-spinner'

import { Text } from '../../Text/Text'
import type { BaseButtonProps } from '../types'

const animationConfig = {
  duration: 120,
  easing: Easing.bezier(0.44, 0, 0.56, 1)
}

const Root = styled(
  Animated.createAnimatedComponent(Pressable)
)<BaseButtonProps>(({ theme, minWidth, disabled, fullWidth }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.xs,
  boxSizing: 'border-box',
  flexShrink: 0,
  justifyContent: 'center',
  overflow: 'hidden',
  minWidth: minWidth && `${minWidth}px`,

  // TODO: This might not be needed, but here now for testing
  opacity: disabled ? 0.45 : 1,

  ...(fullWidth && {
    width: '100%',
    flexShrink: 1
  })
}))

export const BaseButton = (props: BaseButtonProps) => {
  const {
    iconLeft: LeftIconComponent,
    iconRight: RightIconComponent,
    isLoading,
    widthToHideText,
    styles,
    children,
    style,
    ...other
  } = props
  const pressed = useSharedValue(0)
  const [buttonWidth, setButtonWidth] = useState<number | null>(null)

  const isTextHidden =
    widthToHideText && buttonWidth && buttonWidth <= widthToHideText

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = withTiming(1, animationConfig)
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, animationConfig)
    })

  const longPress = Gesture.LongPress()
    .minDuration(animationConfig.duration)
    .onBegin(() => {
      pressed.value = withTiming(1, animationConfig)
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, animationConfig)
    })

  const taps = Gesture.Exclusive(longPress, tap)

  const rootStyles = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.97]) }]
  }))

  const handleLayoutChange = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setButtonWidth(width)
  }, [])

  return (
    <GestureDetector gesture={taps}>
      <Root
        style={[rootStyles, style]}
        onLayout={handleLayoutChange}
        {...other}
      >
        {isLoading ? (
          <LoadingSpinner style={[{ height: 16, width: 16 }, styles?.icon]} />
        ) : LeftIconComponent ? (
          <LeftIconComponent style={styles?.icon} size='s' color='default' />
        ) : null}
        {!isTextHidden ? <Text>{children}</Text> : null}
        {RightIconComponent ? (
          <RightIconComponent style={styles?.icon} size='s' color='default' />
        ) : null}
      </Root>
    </GestureDetector>
  )
}
