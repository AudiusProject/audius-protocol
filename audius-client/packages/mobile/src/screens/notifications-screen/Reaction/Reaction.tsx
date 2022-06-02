import { useCallback, useEffect, useRef, useState } from 'react'

import LottieView, { AnimatedLottieViewProps } from 'lottie-react-native'
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native'

import { spacing } from 'app/styles/spacing'

export type ReactionProps = PressableProps & {
  source: AnimatedLottieViewProps['source']
  style?: StyleProp<ViewStyle>
  status?: 'interacting' | 'idle' | 'selected' | 'unselected'
}

export const Reaction = (props: ReactionProps) => {
  const { source, style, status: statusProp = 'idle', ...other } = props
  const [status, setStatus] = useState(statusProp)
  const animationRef = useRef<LottieView | null>(null)

  const size =
    status === 'interacting'
      ? { height: 90, width: 90 }
      : { height: 72, width: 72 }

  const backgroundColor = status === 'unselected' ? 'gray' : undefined

  useEffect(() => {
    setStatus(statusProp)
  }, [statusProp])

  useEffect(() => {
    if (status === 'unselected') {
      animationRef.current?.pause()
    } else {
      animationRef.current?.play()
    }
  }, [status])

  const handlePressIn = useCallback(() => {
    setStatus('interacting')
  }, [])

  const handlePressOut = useCallback(() => {
    setStatus(statusProp)
  }, [statusProp])

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ ...size, marginRight: spacing(2), backgroundColor }, style]}
      {...other}
    >
      <LottieView
        ref={animation => {
          animationRef.current = animation
        }}
        autoPlay
        loop
        source={source}
      />
    </Pressable>
  )
}
