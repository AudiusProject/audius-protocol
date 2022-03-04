import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react'

import LottieView from 'lottie-react-native'
import { StyleProp, TouchableHighlight, View, ViewStyle } from 'react-native'
import { usePrevious } from 'react-use'

import { GestureResponderHandler } from 'app/types/gesture'
import { useColor } from 'app/utils/theme'

export type BaseAnimatedButtonProps = {
  iconIndex?: number
  onPress?: GestureResponderHandler
  isActive?: boolean
  isDisabled?: boolean
  showUnderlay?: boolean
  style?: StyleProp<ViewStyle>
  wrapperStyle?: StyleProp<ViewStyle>
}

type IconJSON = any

type AnimatedButtonProps = {
  iconJSON: IconJSON | IconJSON[]
} & BaseAnimatedButtonProps

const AnimatedButton = ({
  iconIndex: externalIconIndex,
  iconJSON,
  onPress,
  isActive,
  isDisabled = false,
  showUnderlay = false,
  style,
  wrapperStyle
}: AnimatedButtonProps) => {
  const [iconIndex, setIconIndex] = useState<number>(externalIconIndex ?? 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const underlayColor = useColor('neutralLight8')
  const animationRef = useRef<LottieView | null>()
  const previousExternalIconIndex = usePrevious(externalIconIndex)
  const previousActiveState = usePrevious(isActive)

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

  const handleClick = useCallback(() => {
    if (isDisabled) {
      return
    }

    if (hasMultipleStates || !isActive) {
      setIsPlaying(true)
      animationRef.current?.play()
    }

    onPress?.()
  }, [
    isDisabled,
    onPress,
    isActive,
    setIsPlaying,
    hasMultipleStates,
    animationRef
  ])

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

  return (
    <TouchableHighlight
      onPress={handleClick}
      onLongPress={handleClick}
      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      style={style}
      underlayColor={showUnderlay ? underlayColor : null}
    >
      <View style={wrapperStyle}>
        <LottieView
          ref={animation => (animationRef.current = animation)}
          onAnimationFinish={handleAnimationFinish}
          progress={progress}
          loop={false}
          source={source}
        />
      </View>
    </TouchableHighlight>
  )
}

export type AnimatedButtonProviderProps = {
  isDarkMode: boolean
  iconDarkJSON: IconJSON | IconJSON[]
  iconLightJSON: IconJSON | IconJSON[]
} & BaseAnimatedButtonProps

const AnimatedButtonProvider = ({
  isDarkMode,
  iconDarkJSON,
  iconLightJSON,
  ...buttonProps
}: AnimatedButtonProviderProps) => {
  const [iconJSON, setIconJSON] = useState<IconJSON | IconJSON[] | null>(null)
  const defaultAnimations = useRef<IconJSON | IconJSON[] | null>(null)
  const darkAnimations = useRef<IconJSON | IconJSON[] | null>(null)

  useEffect(() => {
    if (isDarkMode) {
      if (!darkAnimations.current) {
        darkAnimations.current = iconDarkJSON
      }
      setIconJSON(
        Array.isArray(darkAnimations.current)
          ? [...darkAnimations.current]
          : { ...darkAnimations.current }
      )
    } else {
      if (!defaultAnimations.current) {
        defaultAnimations.current = iconLightJSON
      }
      setIconJSON(
        Array.isArray(defaultAnimations.current)
          ? [...defaultAnimations.current]
          : { ...defaultAnimations.current }
      )
    }
  }, [isDarkMode, setIconJSON, iconDarkJSON, iconLightJSON])

  return iconJSON ? (
    <AnimatedButton iconJSON={iconJSON} {...buttonProps} />
  ) : null
}

export default memo(AnimatedButtonProvider)
