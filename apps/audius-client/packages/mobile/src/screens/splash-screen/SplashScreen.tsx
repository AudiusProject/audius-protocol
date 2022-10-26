import { useRef, useState, useEffect, useCallback } from 'react'

import { accountSelectors, themeSelectors, Status } from '@audius/common'
import LottieView from 'lottie-react-native'
import { StyleSheet, Animated, StatusBar, Platform } from 'react-native'
import { useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { updateStatusBarTheme } from 'app/utils/theme'

const { getAccountStatus } = accountSelectors
const { getTheme, getSystemAppearance } = themeSelectors

const SCALE_TO = 1.2
const ANIM_DURATION_MS = 2000
const LOTTIE_HEIGHT = 1350
const BACKGROUND_COLOR = '#7E1BCC'

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
    justifyContent: 'center',
    opacity: 0.5
  }
})

export const SplashScreen = () => {
  const [animationFinished, setAnimationFinished] = useState(false)
  const accountStatus = useSelector(getAccountStatus)
  const theme = useSelector(getTheme)
  const systemAppearance = useSelector(getSystemAppearance)
  const backgroundOpacityAnim = useRef(new Animated.Value(1))

  useEffectOnce(() => {
    if (Platform.OS === 'ios') {
      // Hide the StatusBar on ios
      updateStatusBarTheme(theme, systemAppearance)
      StatusBar.setHidden(true)
    } else {
      // Make the StatusBar translucent on android
      // (hiding it on android causes the app to shift when it's unhidden)
      StatusBar.setBackgroundColor('transparent')
      StatusBar.setTranslucent(true)
    }
  })

  useEffect(() => {
    if (![Status.IDLE, Status.LOADING].includes(accountStatus)) {
      if (animationRef.current) {
        Animated.timing(backgroundOpacityAnim.current, {
          toValue: 0,
          delay: 400,
          duration: 300,
          useNativeDriver: true
        }).start()
        animationRef.current.play()
      }
    }
  }, [accountStatus])

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
    if (Platform.OS === 'ios') {
      // Unhide the StatusBar on ios
      StatusBar.setHidden(false, 'fade')
    } else {
      // Make the StatusBar opaque on android
      updateStatusBarTheme(theme, systemAppearance)
    }
    setAnimationFinished(true)
  }, [setAnimationFinished, theme, systemAppearance])

  const animationRef = useRef<LottieView | null>(null)

  return animationFinished ? null : (
    <Animated.View
      style={{
        ...styles.container,
        transform: [{ scale: scaleAnim }],
        opacity: backgroundOpacityAnim.current
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
