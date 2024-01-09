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
const AnimatedText = Animated.createAnimatedComponent(Text)

export const BaseButton = (props: BaseButtonProps) => {
  const {
    iconLeft: LeftIconComponent,
    iconRight: RightIconComponent,
    isLoading,
    isStaticIcon,
    widthToHideText,
    innerProps,
    children,
    style,
    styles,
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
      <AnimatedText {...innerProps?.text} style={styles?.text}>
        {children}
      </AnimatedText>
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
    overflow: 'hidden',
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
          <LoadingSpinner {...innerProps?.loader} />
        ) : LeftIconComponent ? (
          <LeftIconComponent
            {...innerProps?.icon}
            color={isStaticIcon ? 'default' : innerProps?.icon?.color}
          />
        ) : null}
        {childElement}
        {RightIconComponent ? (
          <RightIconComponent
            {...innerProps?.icon}
            color={isStaticIcon ? 'default' : innerProps?.icon?.color}
          />
        ) : null}
      </AnimatedPressable>
    </GestureDetector>
  )
}
