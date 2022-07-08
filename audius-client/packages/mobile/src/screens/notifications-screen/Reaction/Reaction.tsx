import { useContext, useEffect, useRef, useState } from 'react'

import LottieView, { AnimatedLottieViewProps } from 'lottie-react-native'
import { Animated, StyleProp, View, ViewProps, ViewStyle } from 'react-native'
import { usePrevious } from 'react-use'

import { light, medium } from 'app/haptics'
import { spacing } from 'app/styles/spacing'

import { NotificationsDrawerNavigationContext } from '../NotificationsDrawerNavigationContext'

export type ReactionStatus = 'interacting' | 'idle' | 'selected' | 'unselected'

export type ReactionProps = ViewProps & {
  autoPlay?: boolean
  source: AnimatedLottieViewProps['source']
  style?: StyleProp<ViewStyle>
  status?: ReactionStatus
  onMeasure?: (values: { x: number; width: number }) => void
  isVisible: boolean
}

export const Reaction = (props: ReactionProps) => {
  const {
    autoPlay = true,
    source,
    style,
    status: statusProp = 'idle',
    onMeasure,
    isVisible,
    ...other
  } = props
  const [status, setStatus] = useState(statusProp)
  const animationRef = useRef<LottieView | null>(null)
  const ref = useRef<View | null>(null)
  const { state } = useContext(NotificationsDrawerNavigationContext)
  const scale = useRef(new Animated.Value(1)).current
  const previousStatus = usePrevious(status)

  const isOpen = state?.history.length === 2

  useEffect(() => {
    setStatus(statusProp)
  }, [statusProp])

  useEffect(() => {
    if (status === 'unselected' || !isVisible || !isOpen) {
      // Pause if off screen or unselected
      animationRef.current?.pause()
    } else if (isVisible && autoPlay) {
      animationRef.current?.play()
    }
  }, [status, autoPlay, isVisible, isOpen])

  useEffect(() => {
    if (ref.current && isOpen) {
      // We need to wait until drawer finishes opening before calculating
      // layout, otherwise we calculate off-screen values
      setTimeout(() => {
        ref.current?.measureInWindow((x, _, width) => {
          onMeasure?.({ x, width })
        })
      }, 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onMeasure changes too much
  }, [ref, isOpen])

  useEffect(() => {
    if (previousStatus !== 'interacting' && status === 'interacting') {
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true
      }).start()
      light()
    } else if (previousStatus !== 'selected' && status === 'selected') {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true
        })
      ]).start()
      medium()
    } else if (previousStatus !== status && status !== 'selected') {
      Animated.timing(scale, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true
      }).start()
    }
  })

  return (
    <Animated.View
      ref={ref}
      style={[
        {
          height: 84,
          width: 84,
          padding: spacing(3),
          transform: [{ scale }],
          opacity: status === 'unselected' ? 0.3 : 1
        },
        style
      ]}
      {...other}
    >
      <LottieView
        ref={animation => {
          animationRef.current = animation
        }}
        autoPlay={isVisible && autoPlay}
        loop
        source={source}
      />
    </Animated.View>
  )
}
