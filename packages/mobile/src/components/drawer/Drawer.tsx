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
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import { Portal } from '@gorhom/portal'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import IconRemove from '../../assets/images/iconRemove.svg'
import { useColor } from '../../utils/theme'
import { ThemeColors, useThemedStyles } from '../../hooks/useThemedStyles'

const MAX_SHADOW_OPACITY = 0.4
const ON_MOVE_RESPONDER_DX = 20
const ON_MOVE_RESPONDER_DY = 10
const MOVE_CUTOFF_CLOSE = 0.8
const BORDER_RADIUS = 40

// Controls the amount of friction in swiping when overflowing up or down
const OVERFLOW_FRICTION = 4

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    drawer: {
      backgroundColor: themeColors.neutralLight10,
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      elevation: 5,
      shadowOpacity: 0,
      shadowRadius: 40,
      borderTopRightRadius: BORDER_RADIUS,
      borderTopLeftRadius: BORDER_RADIUS
    },

    drawerContent: {
      padding: 24
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
      backgroundColor: themeColors.neutralLight10,
      width: '100%',
      height: 800
    }
  })

export type DrawerProps = {
  isOpen: boolean
  children: ReactNode
  onClose: () => void
  isFullscreen?: boolean
}

const springToValue = (animation: Animated.Value, value: number) => {
  Animated.spring(animation, {
    toValue: value,
    tension: 150,
    friction: 25,
    useNativeDriver: true
  }).start()
}

const attachToDy = (animation: Animated.Value, newValue: number) => (
  e: GestureResponderEvent
) => {
  Animated.event(
    [
      null,
      {
        dy: animation
      }
    ],
    { useNativeDriver: false }
  )(e, { dy: newValue })
}

const Drawer = ({ isOpen, children, onClose, isFullscreen }: DrawerProps) => {
  const styles = useThemedStyles(createStyles)

  const { height } = Dimensions.get('window')
  const [drawerHeight, setDrawerHeight] = useState(height)
  const initialPosition = height
  const openPosition = height - drawerHeight

  const translationAnim = useRef(new Animated.Value(initialPosition)).current
  const shadowAnim = useRef(new Animated.Value(0)).current
  const borderRadiusAnim = useRef(new Animated.Value(BORDER_RADIUS)).current

  const closeColor = useColor('neutralLight4')

  const slideIn = useCallback(() => {
    springToValue(translationAnim, openPosition)
    springToValue(shadowAnim, MAX_SHADOW_OPACITY)
    if (isFullscreen) {
      springToValue(borderRadiusAnim, 0)
    }
  }, [
    openPosition,
    translationAnim,
    shadowAnim,
    borderRadiusAnim,
    isFullscreen
  ])

  const slideOut = useCallback(() => {
    springToValue(translationAnim, initialPosition)
    springToValue(shadowAnim, 0)
    if (isFullscreen) {
      springToValue(borderRadiusAnim, BORDER_RADIUS)
    }
  }, [
    initialPosition,
    translationAnim,
    shadowAnim,
    borderRadiusAnim,
    isFullscreen
  ])

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
          const newTranslation = openPosition + gestureState.dy
          attachToDy(translationAnim, newTranslation)(e)

          if (isFullscreen) {
            const newBorderRadius =
              BORDER_RADIUS *
              (1 - (drawerHeight - gestureState.dy) / drawerHeight)

            attachToDy(borderRadiusAnim, newBorderRadius)(e)
          }
        } else if (gestureState.dy < 0) {
          // Dragging upwards
          const newTranslation =
            openPosition + gestureState.dy / OVERFLOW_FRICTION
          attachToDy(translationAnim, newTranslation)(e)
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

  // NOTE: sk - Need to interpolate the border radius bc of a funky
  // issue with border radius under 1 in ios
  const interpolatedBorderRadius = borderRadiusAnim.interpolate({
    inputRange: [0, 0.99, 1, BORDER_RADIUS],
    outputRange: [0, 0, 1, BORDER_RADIUS]
  })

  return (
    <Portal>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          ...(isFullscreen ? [styles.fullDrawer] : []),
          {
            shadowOpacity: shadowAnim,
            transform: [
              {
                translateY: translationAnim
              }
            ],
            borderTopRightRadius: interpolatedBorderRadius,
            borderTopLeftRadius: interpolatedBorderRadius
          }
        ]}
      >
        <View style={styles.drawerContent}>
          <SafeAreaView
            edges={['bottom', ...((isFullscreen ? ['top'] : []) as Edge[])]}
            onLayout={(event: LayoutChangeEvent) => {
              if (!isFullscreen) {
                const { height } = event.nativeEvent.layout
                setDrawerHeight(height)
              }
            }}
          >
            {isFullscreen && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={{ marginBottom: 8, width: 30 }}
              >
                <IconRemove width={30} height={30} fill={closeColor} />
              </TouchableOpacity>
            )}
            {children}
          </SafeAreaView>
        </View>
        <View style={styles.skirt} />
      </Animated.View>
    </Portal>
  )
}

export default Drawer
