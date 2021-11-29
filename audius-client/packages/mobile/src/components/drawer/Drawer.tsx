import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import { Portal } from '@gorhom/portal'
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'

import IconRemove from 'app/assets/images/iconRemove.svg'
import { ThemeColors, useThemedStyles } from 'app/hooks/useThemedStyles'
import { useColor } from 'app/utils/theme'

const MAX_SHADOW_OPACITY = 0.4
const ON_MOVE_RESPONDER_DY = 10
const MOVE_CUTOFF_CLOSE = 0.8
const BORDER_RADIUS = 40
const BACKGROUND_OPACITY = 0.5

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
      borderTopLeftRadius: BORDER_RADIUS,
      overflow: 'hidden'
    },

    fullDrawer: {
      top: 0,
      height: '100%'
    },

    titleContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    },

    dismissContainer: {
      position: 'absolute',
      top: 24,
      left: 24
    },

    titleLabel: {
      fontFamily: 'AvenirNextLTPro-Bold',
      fontSize: 18,
      paddingTop: 20,
      color: themeColors.neutral
    },

    isOpen: {
      shadowOpacity: 0.25,
      shadowOffset: {
        width: 50,
        height: 15
      }
    },

    background: {
      position: 'absolute',
      backgroundColor: 'black',
      top: 0,
      height: '100%',
      width: '100%'
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
  title?: string
  isFullscreen?: boolean
  isGestureSupported?: boolean
}

const springToValue = (
  animation: Animated.Value,
  value: number,
  finished?: () => void
) => {
  Animated.spring(animation, {
    toValue: value,
    tension: 150,
    friction: 25,
    useNativeDriver: true
  }).start(finished)
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

const DrawerHeader = ({
  onClose,
  title,
  isFullscreen
}: {
  onClose: () => void
  title?: string
  isFullscreen?: boolean
}) => {
  const styles = useThemedStyles(createStyles)
  const closeColor = useColor('neutralLight4')

  return title || isFullscreen ? (
    <View style={styles.titleContainer}>
      {isFullscreen && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.dismissContainer}
        >
          <IconRemove width={30} height={30} fill={closeColor} />
        </TouchableOpacity>
      )}
      {title && <Text style={styles.titleLabel}>{title}</Text>}
    </View>
  ) : (
    <View />
  )
}

const Drawer = ({
  isOpen,
  children,
  onClose,
  title,
  isFullscreen,
  isGestureSupported = true
}: DrawerProps) => {
  const styles = useThemedStyles(createStyles)

  const { height } = Dimensions.get('window')
  const [drawerHeight, setDrawerHeight] = useState(height)
  // isBackgroundVisible will be true until the close animation finishes
  const [isBackgroundVisible, setIsBackgroundVisible] = useState(false)
  const initialPosition = height
  const openPosition = height - drawerHeight

  const translationAnim = useRef(new Animated.Value(initialPosition)).current
  const shadowAnim = useRef(new Animated.Value(0)).current
  const borderRadiusAnim = useRef(new Animated.Value(BORDER_RADIUS)).current
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current

  const slideIn = useCallback(() => {
    springToValue(translationAnim, openPosition)
    springToValue(shadowAnim, MAX_SHADOW_OPACITY)
    springToValue(backgroundOpacityAnim, BACKGROUND_OPACITY)
    if (isFullscreen) {
      springToValue(borderRadiusAnim, 0)
    }
  }, [
    openPosition,
    translationAnim,
    shadowAnim,
    backgroundOpacityAnim,
    borderRadiusAnim,
    isFullscreen
  ])

  const slideOut = useCallback(() => {
    springToValue(translationAnim, initialPosition, () =>
      setIsBackgroundVisible(false)
    )
    springToValue(shadowAnim, 0)
    springToValue(backgroundOpacityAnim, 0)
    if (isFullscreen) {
      springToValue(borderRadiusAnim, BORDER_RADIUS)
    }
  }, [
    initialPosition,
    translationAnim,
    shadowAnim,
    backgroundOpacityAnim,
    borderRadiusAnim,
    isFullscreen
  ])

  useEffect(() => {
    if (isOpen) {
      slideIn()
      setIsBackgroundVisible(true)
    } else {
      slideOut()
    }
  }, [slideIn, slideOut, isOpen])

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return Math.abs(gestureState.dy) > ON_MOVE_RESPONDER_DY
    },
    onPanResponderMove: (e, gestureState) => {
      if (isOpen) {
        if (gestureState.dy > 0) {
          // Dragging downwards
          const newTranslation = openPosition + gestureState.dy
          attachToDy(translationAnim, newTranslation)(e)

          const percentOpen = (drawerHeight - gestureState.dy) / drawerHeight

          const newOpacity = BACKGROUND_OPACITY * percentOpen
          attachToDy(backgroundOpacityAnim, newOpacity)(e)

          if (isFullscreen) {
            const newBorderRadius = BORDER_RADIUS * (1 - percentOpen)

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

  // NOTE: sk - Need to interpolate the border radius bc of a funky
  // issue with border radius under 1 in ios
  const interpolatedBorderRadius = borderRadiusAnim.interpolate({
    inputRange: [0, 0.99, 1, BORDER_RADIUS],
    outputRange: [0, 0, 1, BORDER_RADIUS]
  })

  const renderBackground = () => {
    const renderBackgroundView = (options?: { pointerEvents: string }) => (
      <Animated.View
        pointerEvents={options?.pointerEvents}
        style={[styles.background, { opacity: backgroundOpacityAnim }]}
      />
    )
    // The background should be visible and touchable when the drawer is open
    if (isOpen) {
      return (
        <TouchableWithoutFeedback onPress={onClose}>
          {renderBackgroundView()}
        </TouchableWithoutFeedback>
      )
    }

    // The background should be visible and not touchable as the drawer is closing
    // (isOpen is false but isBackgroundVisible is true)
    // This is to prevent blocking touches as the drawer is closing
    if (isBackgroundVisible) {
      return renderBackgroundView({ pointerEvents: 'none' })
    }
  }

  return (
    <Portal>
      <>
        {renderBackground()}
        <Animated.View
          {...(isGestureSupported ? panResponder.panHandlers : {})}
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
          <SafeAreaView
            edges={['bottom', ...((isFullscreen ? ['top'] : []) as Edge[])]}
            onLayout={(event: LayoutChangeEvent) => {
              if (!isFullscreen) {
                const { height } = event.nativeEvent.layout
                setDrawerHeight(height)
              }
            }}
          >
            <DrawerHeader
              onClose={onClose}
              title={title}
              isFullscreen={isFullscreen}
            />
            {children}
          </SafeAreaView>
          <View style={styles.skirt} />
        </Animated.View>
      </>
    </Portal>
  )
}

export default Drawer
