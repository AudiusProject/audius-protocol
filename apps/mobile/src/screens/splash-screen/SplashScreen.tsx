import { useRef, useState, useEffect, useCallback } from 'react'

import LottieView from 'lottie-react-native'
import { StyleSheet, Animated } from 'react-native'

const SCALE_TO = 1.2
const ANIM_DURATION_MS = 2000
const LOTTIE_HEIGHT = 1350
const BACKGROUND_COLOR = '#7E1BCC'

export const SplashScreen = () => {
  const [animationFinished, setAnimationFinished] = useState(false)

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.play()
    }
  })

  const [scaleAnim] = useState(new Animated.Value(1))

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: SCALE_TO,
          duration: ANIM_DURATION_MS,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: ANIM_DURATION_MS,
          useNativeDriver: true
        })
      ])
    ).start()
  }, [scaleAnim])

  const onAnimationFinish = useCallback(() => {
    setAnimationFinished(true)
  }, [setAnimationFinished])

  const animationRef = useRef<LottieView | null>(null)

  return animationFinished ? null : (
    <Animated.View
      style={{
        ...styles.container,
        transform: [{ scale: scaleAnim }]
      }}
    >
      <LottieView
        source={require('app/assets/animations/splashscreen.json')}
        ref={(animation) => {
          animationRef.current = animation
        }}
        autoPlay={false}
        loop={false}
        onAnimationFinish={onAnimationFinish}
        style={{
          height: LOTTIE_HEIGHT
        }}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BACKGROUND_COLOR,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
