import { useCallback, useState } from 'react'

import { Pressable, type LayoutChangeEvent, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import LoadingSpinner from 'app/components/loading-spinner'

import { useTheme } from '../../../foundations/theme'
import { Text } from '../../Text/Text'
import type { BaseButtonProps } from '../types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const BaseButton = (props: BaseButtonProps) => {
  const {
    iconLeft: LeftIconComponent,
    iconRight: RightIconComponent,
    isLoading,
    widthToHideText,
    styles,
    children,
    style,
    sharedValue: sharedValueProp,
    minWidth,
    fullWidth,
    ...other
  } = props
  const pressedInternal = useSharedValue(0)
  const pressed = sharedValueProp || pressedInternal
  const { spacing, motion } = useTheme()
  const [buttonWidth, setButtonWidth] = useState<number | null>(null)
  const isTextChild = typeof children === 'string'

  const isTextHidden =
    isTextChild &&
    widthToHideText &&
    buttonWidth &&
    buttonWidth <= widthToHideText

  const childElement = isTextChild ? (
    !isTextHidden ? (
      <Text>{children}</Text>
    ) : null
  ) : (
    children
  )

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = withTiming(1, motion.hover)
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, motion.press)
    })

  const rootStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth,
    ...(fullWidth && {
      width: '100%',
      flexShrink: 1
    })
  }

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.97]) }]
  }))

  const handleLayoutChange = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setButtonWidth(width)
  }, [])

  return (
    <GestureDetector gesture={tap}>
      <AnimatedPressable
        style={[rootStyles, animatedStyles, style]}
        onLayout={handleLayoutChange}
        {...other}
      >
        {isLoading ? (
          <LoadingSpinner style={[{ height: 16, width: 16 }, styles?.icon]} />
        ) : LeftIconComponent ? (
          <LeftIconComponent style={styles?.icon} size='s' color='default' />
        ) : null}
        {childElement}
        {RightIconComponent ? (
          <RightIconComponent style={styles?.icon} size='s' color='default' />
        ) : null}
      </AnimatedPressable>
    </GestureDetector>
  )
}
