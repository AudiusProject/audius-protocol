import { ReactionTypes  } from '@audius/common/store'
     import { useEffect, useCallback, useRef, useState } from 'react'

import type { } from '@audius/common'
import type { LottieViewProps } from 'lottie-react-native'
import LottieView from 'lottie-react-native'
import type {
  LayoutChangeEvent,
  StyleProp,
  ViewProps,
  ViewStyle
} from 'react-native'
import { Animated } from 'react-native'
import { usePrevious } from 'react-use'

import { light, medium } from 'app/haptics'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    height: 84,
    width: 84,
    padding: spacing(3)
  },
  lottie: {
    height: '100%',
    width: '100%'
  }
}))

export type ReactionStatus = 'interacting' | 'idle' | 'selected' | 'unselected'

type OnMeasureConfig = { x: number; width: number; reactionType: ReactionTypes }

export type OnMeasure = (config: OnMeasureConfig) => void

export type ReactionProps = ViewProps & {
  reactionType: ReactionTypes
  autoPlay?: boolean
  source: LottieViewProps['source']
  scale?: number
  style?: StyleProp<ViewStyle>
  status?: ReactionStatus
  onMeasure?: OnMeasure
  isVisible: boolean
}

export const Reaction = (props: ReactionProps) => {
  const {
    reactionType,
    autoPlay = true,
    source,
    scale: scaleProp = 1.3,
    style,
    status: statusProp = 'idle',
    onMeasure,
    isVisible,
    ...other
  } = props
  const styles = useStyles()
  const [status, setStatus] = useState(statusProp)
  const animationRef = useRef<LottieView | null>(null)
  const scale = useRef(new Animated.Value(1)).current
  const previousStatus = usePrevious(status)

  useEffect(() => {
    setStatus(statusProp)
  }, [statusProp])

  useEffect(() => {
    if (status === 'unselected' || !isVisible) {
      animationRef.current?.pause()
    } else if (isVisible && autoPlay) {
      animationRef.current?.play()
    }
  }, [status, autoPlay, isVisible])

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout
      onMeasure?.({ x, width, reactionType })
    },
    [onMeasure, reactionType]
  )

  useEffect(() => {
    if (previousStatus !== 'interacting' && status === 'interacting') {
      Animated.timing(scale, {
        toValue: scaleProp,
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

  const animatedStyles = {
    transform: [{ scale }],
    opacity: status === 'unselected' ? 0.3 : 1
  }

  return (
    <Animated.View
      style={[styles.root, animatedStyles, style]}
      onLayout={handleLayout}
      {...other}
    >
      <LottieView
        ref={(animation) => {
          animationRef.current = animation
        }}
        autoPlay={isVisible && autoPlay}
        loop
        source={source}
        style={styles.lottie}
      />
    </Animated.View>
  )
}
