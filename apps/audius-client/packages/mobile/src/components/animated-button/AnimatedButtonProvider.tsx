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
  uniqueKey: string
  isActive: boolean
  isDisabled?: boolean
  style: ViewStyle
  wrapperStyle: ViewStyle
}

type IconJSON = any

type AnimatedButtonProps = {
  iconJSON: IconJSON
} & BaseAnimatedButtonProps

const AnimatedButton = ({
  iconJSON,
  onPress,
  isActive,
  isDisabled = false,
  style,
  wrapperStyle
}: AnimatedButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const underlayColor = useColor('neutralLight8')
  const animationRef = useRef<LottieView | null>()

  const handleAnimationFinish = useCallback(() => setIsPlaying(false), [
    setIsPlaying
  ])

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
      style={style}
      underlayColor={underlayColor}
    >
      <View style={wrapperStyle}>
        <LottieView
          ref={animation => (animationRef.current = animation)}
          onAnimationFinish={handleAnimationFinish}
          progress={progress}
          loop={false}
          source={iconJSON}
        />
      </View>
    </TouchableHighlight>
  )
}

export type AnimatedButtonProviderProps = {
  isDarkMode: boolean
  iconDarkJSON: any
  iconLightJSON: any
} & BaseAnimatedButtonProps

const AnimatedButtonProvider = ({
  isDarkMode,
  iconDarkJSON,
  iconLightJSON,
  ...buttonProps
}: AnimatedButtonProviderProps) => {
  const [iconJSON, setIconJSON] = useState<IconJSON | null>(null)
  const defaultAnimations = useRef<IconJSON | null>(null)
  const darkAnimations = useRef<IconJSON | null>(null)

  useEffect(() => {
    if (isDarkMode) {
      if (!darkAnimations.current) {
        darkAnimations.current = iconDarkJSON
      }
      setIconJSON({ ...darkAnimations.current })
    } else {
      if (!defaultAnimations.current) {
        defaultAnimations.current = iconLightJSON
      }
      setIconJSON({ ...defaultAnimations.current })
    }
  }, [isDarkMode, setIconJSON, iconDarkJSON, iconLightJSON])

  return iconJSON && <AnimatedButton iconJSON={iconJSON} {...buttonProps} />
}

export default memo(AnimatedButtonProvider)
