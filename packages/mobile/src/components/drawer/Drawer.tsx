import React, {
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useState
} from 'react'
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View
} from 'react-native'
import { Portal } from '@gorhom/portal'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../utils/theme'

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    elevation: 5,
    shadowOpacity: 0,
    shadowRadius: 40,
    borderRadius: 40
  },

  fullDrawer: {
    top: 0,
    height: '100%'
  },

  dismissContainer: {
    position: 'absolute',
    top: 16,
    left: 16
  },

  isOpen: {
    shadowOpacity: 0.25,
    shadowOffset: {
      width: 50,
      height: 15
    }
  },

  skirt: {
    width: '100%',
    height: 800
  }
})

const MAX_SHADOW_OPACITY = 0.4
const ON_MOVE_RESPONDER_DX = 20
const ON_MOVE_RESPONDER_DY = 10
const MOVE_CUTOFF_CLOSE = 0.8

// Controls the amount of friction in swiping when overflowing up or down
const OVERFLOW_FRICTION = 4

export type DrawerProps = {
  isOpen: boolean
  children: ReactNode
  onClose: () => void
  isFullscreen?: boolean
}

const Drawer = ({ isOpen, children, onClose, isFullscreen }: DrawerProps) => {
  const drawerStyle = useTheme(styles.drawer, {
    backgroundColor: 'neutralLight10'
  })

  const { height } = Dimensions.get('window')
  const [drawerHeight, setDrawerHeight] = useState(0)
  const initialPosition = height
  const openPosition = height - drawerHeight

  const translationAnim = useRef(new Animated.Value(initialPosition)).current
  const shadowAnim = useRef(new Animated.Value(0)).current

  const slideIn = useCallback(() => {
    Animated.spring(translationAnim, {
      toValue: openPosition,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()

    Animated.spring(shadowAnim, {
      toValue: MAX_SHADOW_OPACITY,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()
  }, [openPosition, translationAnim, shadowAnim])

  const slideOut = useCallback(() => {
    Animated.spring(translationAnim, {
      toValue: initialPosition,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()

    Animated.spring(shadowAnim, {
      toValue: 0,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()
  }, [initialPosition, translationAnim, shadowAnim])

  useEffect(() => {
    if (isOpen) {
      slideIn()
    } else {
      slideOut()
    }
  }, [slideIn, slideOut, isOpen])

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return (
        Math.abs(gestureState.dx) > ON_MOVE_RESPONDER_DX &&
        Math.abs(gestureState.dy) < ON_MOVE_RESPONDER_DY
      )
    },
    onPanResponderMove: (e, gestureState) => {
      if (isOpen) {
        if (gestureState.dy > 0) {
          // Dragging downwards
          Animated.event(
            [
              null,
              {
                dy: translationAnim
              }
            ],
            { useNativeDriver: false }
          )(e, { dy: openPosition + gestureState.dy })
        } else if (gestureState.dy < 0) {
          // Dragging upwards
          Animated.event(
            [
              null,
              {
                dy: translationAnim
              }
            ],
            { useNativeDriver: false }
          )(e, { dy: openPosition + gestureState.dy / OVERFLOW_FRICTION })
        }
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (isOpen) {
        // Close if open & drag is past cutoff
        if (
          gestureState.vy > 0 &&
          gestureState.moveY > height - MOVE_CUTOFF_CLOSE * drawerHeight
        ) {
          slideOut()
          onClose()
        } else {
          slideIn()
        }
      }
    }
  })

  // TODO: sk - click outside
  // NOTE: This is currently handled by the web app
  //   const clickOutsideRef = useClickOutside(() => close())

  return (
    <Portal>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          drawerStyle,
          ...(isFullscreen ? [styles.fullDrawer] : []),
          {
            shadowOpacity: shadowAnim,
            transform: [
              {
                translateY: translationAnim
              }
            ]
          }
        ]}
      >
        <SafeAreaView
          edges={['bottom']}
          onLayout={(event: LayoutChangeEvent) => {
            const { height } = event.nativeEvent.layout
            setDrawerHeight(height)
          }}
        >
          {children}
        </SafeAreaView>
        <View style={styles.skirt} />
      </Animated.View>
    </Portal>
  )
}

export default Drawer
