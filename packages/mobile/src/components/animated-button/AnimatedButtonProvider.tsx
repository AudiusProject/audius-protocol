import React, {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react'

import LottieView from 'lottie-react-native'
import { TouchableHighlight, View, ViewStyle } from 'react-native'

import { useColor } from 'app/utils/theme'

export type BaseAnimatedButtonProps = {
  onPress: () => void
  isActive?: boolean
  isDisabled?: boolean
  showUnderlay?: boolean
  style?: ViewStyle
  wrapperStyle?: ViewStyle
}

type IconJSON = any

type AnimatedButtonProps = {
  iconJSON: IconJSON | IconJSON[]
} & BaseAnimatedButtonProps

const AnimatedButton = ({
  iconJSON,
  onPress,
  isActive,
  isDisabled = false,
  showUnderlay = false,
  style,
  wrapperStyle
}: AnimatedButtonProps) => {
  const [iconIndex, setIconIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const underlayColor = useColor('neutralLight8')
  const animationRef = useRef<LottieView | null>()

  const hasMultipleStates = Array.isArray(iconJSON)
  let source: IconJSON
  if (hasMultipleStates) {
    source = iconJSON[iconIndex]
  } else {
    source = iconJSON
  }

  const handleAnimationFinish = useCallback(() => {
    if (hasMultipleStates) {
      setIconIndex(iconIndex => (iconIndex + 1) % iconJSON.length)
    }
    setIsPlaying(false)
  }, [setIsPlaying, hasMultipleStates, setIconIndex, iconJSON])

  const handleClick = useCallback(() => {
    if (isDisabled) {
      return
    }

    if (!isActive) {
      setIsPlaying(true)
      animationRef.current?.play()
    }

    onPress()
  }, [isDisabled, onPress, isActive, setIsPlaying])

  const progress = useMemo(() => {
    if (isPlaying) {
      return undefined
    }

    return isActive ? 1 : 0
  }, [isPlaying, isActive])

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

  return iconJSON && <AnimatedButton iconJSON={iconJSON} {...buttonProps} />
}

export default memo(AnimatedButtonProvider)
