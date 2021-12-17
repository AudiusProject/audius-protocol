import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle
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

const createStyles = (zIndex = 5) => (themeColors: ThemeColors) =>
  StyleSheet.create({
    drawer: {
      backgroundColor: themeColors.neutralLight10,
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      elevation: zIndex,
      zIndex: zIndex,
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

    content: {
      height: 'auto'
    },

    fullScreenContent: {
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

export enum DrawerAnimationStyle {
  STIFF = 'STIFF',
  SPRINGY = 'SPRINGY'
}

export type DrawerProps = {
  /**
   * Whether or not the drawer is open
   */
  isOpen: boolean
  /**
   * Contents to render inside the drawer
   */
  children: ReactNode
  /**
   * Callback fired when the drawer is closed or swiped away
   */
  onClose: () => void
  /**
   * Callback fired when the drawer is opened or summoned
   */
  onOpen?: () => void
  /**
   * Header title if this drawer has a header
   */
  title?: string
  /**
   * Whether or not this is a fullscreen drawer with a dismiss button
   */
  isFullscreen?: boolean
  /**
   * Whether or not gestures are supported by the drawer
   */
  isGestureSupported?: boolean
  /**
   * Whether or not the background behind the drawer should dim
   */
  shouldBackgroundDim?: boolean
  /**
   * The style that controls slideIn and slideOut animations
   */
  animationStyle?: DrawerAnimationStyle
  /**
   * Position from bottom (initial offset) of the Drawer
   * so that it may be dragged open in addition to closed.
   * The NowPlayingDrawer exhibits this behavior.
   */
  initialOffsetPosition?: number
  /**
   * Whether or not the drawer is open partially (to the initial offset)
   */
  isOpenToInitialOffset?: boolean
  /**
   * Whether or not we should be showing rounded or straight borders at
   * the initial offset if one is enabled.
   */
  shouldHaveRoundedBordersAtInitialOffset?: boolean
  /**
   * Drawer zIndex. Default to 5.
   */
  zIndex?: number
  /**
   * Optional callback fired during drag of the drawer with the percentage
   * of how open the drawer is (0% being closed, 100% being open)
   */
  onPercentOpen?: (percentOpen: number) => void
  /**
   * Optional callback attached to the drawer's onPanResponderMove.
   * Other UI that wishes to attach to the animation of the drawer
   * may use this prop to respond to the drag gesture.
   */
  onPanResponderMove?: (
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => void
  /**
   * Optional styles to apply to the Drawer container
   */
  drawerStyle?: ViewStyle
}

const springToValue = (
  animation: Animated.Value,
  value: number,
  animationStyle: DrawerAnimationStyle,
  finished?: () => void
) => {
  let tension: number
  let friction: number
  switch (animationStyle) {
    case DrawerAnimationStyle.STIFF:
      tension = 150
      friction = 25
      break
    case DrawerAnimationStyle.SPRINGY:
      tension = 160
      friction = 15
      break
  }
  Animated.spring(animation, {
    toValue: value,
    tension,
    friction,
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
  isFullscreen,
  zIndex
}: {
  onClose: () => void
  title?: string
  isFullscreen?: boolean
  zIndex?: number
}) => {
  const styles = useThemedStyles(createStyles(zIndex))
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
  onOpen,
  title,
  isFullscreen,
  shouldBackgroundDim = true,
  isGestureSupported = true,
  animationStyle = DrawerAnimationStyle.STIFF,
  initialOffsetPosition,
  isOpenToInitialOffset,
  shouldHaveRoundedBordersAtInitialOffset = false,
  zIndex,
  drawerStyle,
  onPercentOpen,
  onPanResponderMove
}: DrawerProps) => {
  const styles = useThemedStyles(createStyles(zIndex))

  const { height } = Dimensions.get('window')
  const [drawerHeight, setDrawerHeight] = useState(height)
  // isBackgroundVisible will be true until the close animation finishes
  const [isBackgroundVisible, setIsBackgroundVisible] = useState(false)

  // Initial position of the drawer when closed
  const initialPosition = height
  // Position of the drawer when it is in an offset but closed state
  const initialOffsetOpenPosition = height - initialOffsetPosition
  // Position of the fully opened drawer
  const openPosition = height - drawerHeight

  const translationAnim = useRef(new Animated.Value(initialPosition)).current
  const shadowAnim = useRef(new Animated.Value(0)).current
  const borderRadiusAnim = useRef(new Animated.Value(BORDER_RADIUS)).current
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current

  const slideIn = useCallback(
    (position: number) => {
      springToValue(translationAnim, position, animationStyle)
      if (isFullscreen) {
        springToValue(borderRadiusAnim, 0, animationStyle)
      }
      if (shouldBackgroundDim) {
        springToValue(shadowAnim, MAX_SHADOW_OPACITY, animationStyle)
        springToValue(backgroundOpacityAnim, BACKGROUND_OPACITY, animationStyle)
      }
    },
    [
      translationAnim,
      shadowAnim,
      backgroundOpacityAnim,
      borderRadiusAnim,
      shouldBackgroundDim,
      isFullscreen,
      animationStyle
    ]
  )

  const slideOut = useCallback(
    (position: number) => {
      springToValue(translationAnim, position, animationStyle, () =>
        setIsBackgroundVisible(false)
      )
      if (isFullscreen) {
        springToValue(borderRadiusAnim, BORDER_RADIUS, animationStyle)
      }
      if (shouldBackgroundDim) {
        springToValue(shadowAnim, 0, animationStyle)
        springToValue(backgroundOpacityAnim, 0, animationStyle)
      }
    },
    [
      translationAnim,
      shadowAnim,
      backgroundOpacityAnim,
      borderRadiusAnim,
      isFullscreen,
      shouldBackgroundDim,
      animationStyle
    ]
  )

  useEffect(() => {
    if (isOpen) {
      slideIn(openPosition)
      setIsBackgroundVisible(true)
    } else {
      if (isOpenToInitialOffset) {
        borderRadiusAnim.setValue(0)
        slideOut(initialOffsetOpenPosition)
      } else {
        slideOut(initialPosition)
      }
    }
  }, [
    slideIn,
    slideOut,
    isOpen,
    openPosition,
    initialPosition,
    isOpenToInitialOffset,
    initialOffsetOpenPosition,
    borderRadiusAnim
  ])

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return Math.abs(gestureState.dy) > ON_MOVE_RESPONDER_DY
    },
    /**
     * Callback when the user is dragging on the drawer.
     * There are two primary modes of operation:
     *  - Normal drawers that open by some UI action and can be swiped away by a user
     *  - Drawers that are partially showing on the screen (e.g. Now Playing)
     *    that start at an initial offset and can be dragged open
     */
    onPanResponderMove: (e, gestureState) => {
      if (isOpen || isOpenToInitialOffset) {
        if (gestureState.dy > 0) {
          // Dragging downwards
          const percentOpen = (drawerHeight - gestureState.dy) / drawerHeight

          if (isOpen) {
            const newTranslation = openPosition + gestureState.dy
            attachToDy(translationAnim, newTranslation)(e)

            if (shouldBackgroundDim) {
              const newOpacity = BACKGROUND_OPACITY * percentOpen
              attachToDy(backgroundOpacityAnim, newOpacity)(e)
            }

            if (isFullscreen) {
              const newBorderRadius = BORDER_RADIUS * (1 - percentOpen)
              attachToDy(borderRadiusAnim, newBorderRadius)(e)
            }

            // If we are "closing" the drawer to an offset position
            if (initialOffsetPosition) {
              // Set up border animations so that
              // - In the offset position, they are either 0 or BORDER_RADIUS
              // - While dragging open, they have BORDER_RADIUS
              // - While fully open, they are 0
              const borderRadiusInitialOffset = shouldHaveRoundedBordersAtInitialOffset
                ? BORDER_RADIUS
                : BORDER_RADIUS * percentOpen * 5
              const newBorderRadius = Math.min(
                borderRadiusInitialOffset,
                BORDER_RADIUS,
                BORDER_RADIUS * 2 * (1 - percentOpen)
              )
              attachToDy(borderRadiusAnim, newBorderRadius)(e)
            }
          }

          // Dragging downwards with an initial offset
          if (isOpenToInitialOffset) {
            const newTranslation =
              initialOffsetOpenPosition + gestureState.dy / OVERFLOW_FRICTION
            attachToDy(translationAnim, newTranslation)(e)
          }

          if (onPercentOpen) onPercentOpen(percentOpen)
        } else if (gestureState.dy < 0) {
          // Dragging upwards
          const percentOpen = (-1 * gestureState.dy) / drawerHeight

          if (isOpen) {
            const newTranslation =
              openPosition + gestureState.dy / OVERFLOW_FRICTION
            attachToDy(translationAnim, newTranslation)(e)
          }

          // Dragging upwards with an initial offset
          if (isOpenToInitialOffset) {
            const newTranslation = initialOffsetOpenPosition + gestureState.dy
            attachToDy(translationAnim, newTranslation)(e)

            // Set up border animations so that
            // - In the offset position, they are either 0 or BORDER_RADIUS
            // - While dragging open, they have BORDER_RADIUS
            // - While fully open, they are 0
            const borderRadiusInitialOffset = shouldHaveRoundedBordersAtInitialOffset
              ? BORDER_RADIUS
              : BORDER_RADIUS * percentOpen * 5
            const newBorderRadius = Math.min(
              borderRadiusInitialOffset,
              BORDER_RADIUS,
              BORDER_RADIUS * 2 * (1 - percentOpen)
            )
            attachToDy(borderRadiusAnim, newBorderRadius)(e)
          }

          if (onPercentOpen) onPercentOpen(percentOpen)
        }
      }
      if (onPanResponderMove) onPanResponderMove(e, gestureState)
    },
    /**
     * When the user releases their hold of the drawer
     */
    onPanResponderRelease: (e, gestureState) => {
      if (isOpen || isOpenToInitialOffset) {
        // Close if open & drag is past cutoff
        if (
          gestureState.vy > 0 &&
          gestureState.moveY > height - MOVE_CUTOFF_CLOSE * drawerHeight
        ) {
          if (isOpenToInitialOffset) {
            slideOut(initialOffsetOpenPosition)
            borderRadiusAnim.setValue(0)
          } else {
            slideOut(initialPosition)
          }
          onClose()
        } else {
          slideIn(openPosition)
          if (initialOffsetOpenPosition) {
            borderRadiusAnim.setValue(0)
          }
          if (onOpen) onOpen()
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
    <>
      {shouldBackgroundDim ? renderBackground() : null}
      <Animated.View
        {...(isGestureSupported ? panResponder.panHandlers : {})}
        style={[
          styles.drawer,
          drawerStyle,
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
          style={isFullscreen ? styles.fullScreenContent : styles.content}
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
  )
}

export default Drawer
