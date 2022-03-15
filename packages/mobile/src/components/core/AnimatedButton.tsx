import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode
} from 'react'

import LottieView from 'lottie-react-native'
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'
import { usePrevious } from 'react-use'

import { GestureResponderHandler } from 'app/types/gesture'
import { Theme, useThemeVariant } from 'app/utils/theme'

export type BaseAnimatedButtonProps = {
  iconIndex?: number
  isActive?: boolean
  isDisabled?: boolean
  onLongPress?: GestureResponderHandler
  onPress?: GestureResponderHandler
  renderUnderlay?: (state: PressableStateCallbackType) => ReactNode
  style?: PressableProps['style']
  wrapperStyle?: StyleProp<ViewStyle>
}

type IconJSON = any

export type AnimatedButtonProps = {
  iconDarkJSON: IconJSON | IconJSON[]
  iconLightJSON: IconJSON | IconJSON[]
} & BaseAnimatedButtonProps

export const AnimatedButton = ({
  iconIndex: externalIconIndex,
  iconDarkJSON,
  iconLightJSON,
  isActive,
  isDisabled = false,
  onLongPress,
  onPress,
  renderUnderlay,
  style,
  wrapperStyle
}: AnimatedButtonProps) => {
  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK

  const [iconIndex, setIconIndex] = useState<number>(externalIconIndex ?? 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const animationRef = useRef<LottieView | null>()
  const previousExternalIconIndex = usePrevious(externalIconIndex)
  const previousActiveState = usePrevious(isActive)

  const iconJSON = useMemo(() => {
    return isDarkMode ? iconDarkJSON : iconLightJSON
  }, [isDarkMode, iconDarkJSON, iconLightJSON])

  // When externalIconIndex is updated, update iconIndex
  // if animation isn't currently playing
  if (
    externalIconIndex !== undefined &&
    previousExternalIconIndex !== undefined &&
    previousExternalIconIndex !== externalIconIndex &&
    iconIndex !== externalIconIndex &&
    !isPlaying
  ) {
    setIconIndex(externalIconIndex)
  }

  const hasMultipleStates = Array.isArray(iconJSON)
  let source: IconJSON
  if (hasMultipleStates) {
    source = iconJSON[iconIndex]
  } else {
    source = iconJSON
  }

  const handleAnimationFinish = useCallback(() => {
    if (hasMultipleStates) {
      setIconIndex(iconIndex => {
        // If externalIconIndex is provided,
        // set iconIndex to it
        if (externalIconIndex !== undefined) {
          return externalIconIndex
        }
        // Otherwise increment iconIndex
        return (iconIndex + 1) % iconJSON.length
      })
    }
    setIsPlaying(false)
  }, [
    hasMultipleStates,
    setIconIndex,
    setIsPlaying,
    iconJSON,
    externalIconIndex
  ])

  const handlePress = useCallback(() => {
    if (hasMultipleStates || !isActive) {
      setIsPlaying(true)
      animationRef.current?.play()
    }

    onPress?.()
  }, [onPress, isActive, setIsPlaying, hasMultipleStates, animationRef])

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress()
    } else {
      handlePress()
    }
  }, [onLongPress, handlePress])

  // For multi state buttons, when `isActive` flips, trigger
  // the animation to run
  useEffect(() => {
    if (hasMultipleStates) {
      if (isActive !== previousActiveState && !isPlaying) {
        setIsPlaying(true)
        animationRef.current?.play()
      }
    }
  }, [
    isActive,
    previousActiveState,
    isPlaying,
    setIsPlaying,
    hasMultipleStates,
    animationRef
  ])

  const progress = useMemo(() => {
    if (hasMultipleStates || isPlaying) {
      return undefined
    }

    return isActive ? 1 : 0
  }, [isPlaying, isActive, hasMultipleStates])

  // For binary state buttons, reset the animation
  // when not playing. This prevents the animation from getting stuck
  // in the active state when many rerenders are happening
  useEffect(() => {
    if (!hasMultipleStates && !isActive && !isPlaying) {
      animationRef.current?.reset()
    }
  }, [hasMultipleStates, isActive, isPlaying])

  return iconJSON ? (
    <Pressable
      disabled={isDisabled}
      onPress={handlePress}
      onLongPress={handleLongPress}
      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      style={style}
    >
      {pressableState => (
        <>
          {renderUnderlay?.(pressableState)}
          <View style={wrapperStyle}>
            <LottieView
              ref={animation => (animationRef.current = animation)}
              onAnimationFinish={handleAnimationFinish}
              progress={progress}
              loop={false}
              source={source}
            />
          </View>
        </>
      )}
    </Pressable>
  ) : null
}
