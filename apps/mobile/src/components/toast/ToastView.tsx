import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'

import { Animated, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Text from 'app/components/text'
import { makeStyles } from 'app/styles'

const DISTANCE_DOWN = 60

const springConfig = {
  tension: 125,
  friction: 20
}

export type ToastType = 'info' | 'error'

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toastView: {
    position: 'absolute',
    backgroundColor: palette.secondary,
    borderRadius: 8
  },
  toastViewError: {
    backgroundColor: palette.accentRed
  },
  toastTextContainer: {
    paddingTop: spacing(3) + 2,
    paddingBottom: spacing(3),
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing(4),
    paddingRight: spacing(4)
  },
  content: {
    color: palette.staticWhite,
    fontSize: 14
  }
}))

export type ToastViewProps = {
  /**
   * The content inside the toast. Can be text or component.
   */
  content: ReactNode
  /**
   * The timeout before the toast fades away
   */
  timeout: number
  /**
   * The type of toast (info, error, etc.)
   */
  type: ToastType
}

const ToastView = ({ content, timeout, type = 'info' }: ToastViewProps) => {
  const styles = useStyles()
  const translationAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()

  const animOut = useCallback(() => {
    Animated.spring(opacityAnim, {
      ...springConfig,
      toValue: 0,
      useNativeDriver: true
    }).start()
    Animated.spring(translationAnim, {
      ...springConfig,
      toValue: 0,
      useNativeDriver: true
    }).start()
  }, [translationAnim, opacityAnim])

  const animIn = useCallback(() => {
    const callback = () => {
      setTimeout(() => {
        animOut()
      }, timeout)
    }
    Animated.spring(opacityAnim, {
      ...springConfig,
      toValue: 1,
      useNativeDriver: true
    }).start()
    Animated.spring(translationAnim, {
      ...springConfig,
      toValue: Math.max(DISTANCE_DOWN, insets.top + 20),
      useNativeDriver: true
    }).start(callback)
  }, [translationAnim, opacityAnim, animOut, timeout, insets])

  useEffect(() => {
    animIn()
  }, [animIn])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.toastView,
          {
            opacity: opacityAnim,
            transform: [
              {
                translateY: translationAnim
              }
            ]
          },
          type === 'error' ? styles.toastViewError : {}
        ]}
      >
        <View style={styles.toastTextContainer}>
          <Text style={styles.content} weight={'demiBold'}>
            {content}
          </Text>
        </View>
      </Animated.View>
    </View>
  )
}

export default ToastView
