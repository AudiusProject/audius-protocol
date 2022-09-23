import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  GestureResponderEvent,
  ImageSourcePropType,
  ImageStyle,
  LayoutChangeEvent,
  PanResponderGestureState,
  ViewStyle
} from 'react-native'
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import type { Edge } from 'react-native-safe-area-context'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import IconRemove from 'app/assets/images/iconRemove.svg'
import type { ThemeColors } from 'app/hooks/useThemedStyles'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { getAndroidNavigationBarHeight } from 'app/store/mobileUi/selectors'
import { attachToDy } from 'app/utils/animation'
import { useColor } from 'app/utils/theme'

import { FULL_DRAWER_HEIGHT } from './constants'

const MAX_SHADOW_OPACITY = 0.15
const ON_MOVE_RESPONDER_DY = 10
const MOVE_CUTOFF_CLOSE = 0.8
const BORDER_RADIUS = 40
const BACKGROUND_OPACITY = 0.5

// Controls the amount of friction in swiping when overflowing up or down
const OVERFLOW_FRICTION = 4

const createStyles =
  (zIndex = 5, shouldAnimateShadow = true) =>
  (themeColors: ThemeColors) =>
    StyleSheet.create({
      drawer: {
        backgroundColor: themeColors.neutralLight10,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        elevation: zIndex,
        zIndex,
        shadowOpacity: shouldAnimateShadow ? 0 : MAX_SHADOW_OPACITY,
        shadowRadius: 15,
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

      titleBarContainer: {
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

      titleContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20
      },

      titleIcon: {
        marginRight: 12,
        height: 24,
        width: 24
      },

      titleLabel: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
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
  onClosed?: () => void
  /**
   * Callback fired when the drawer is opened or summoned
   */
  onOpen?: () => void
  /**
   * Disable the SafeAreaView
   */
  disableSafeAreaView?: boolean
  /**
   * Header title if this drawer has a header
   */
  title?: string
  /**
   * Icon to display in the header next to the title (must also include title)
   */
  titleIcon?: ImageSourcePropType
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
   * Whether or not to animate the shadow on top of the drawer.
   * Default to true.
   */
  shouldAnimateShadow?: boolean
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
   * Whether or not the drawer should close to the initial offset. i.e.
   * has it been opened to the offset once?
   */
  shouldCloseToInitialOffset?: boolean
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

  translationAnim?: Animated.Value
}

export const springToValue = ({
  animation,
  value,
  animationStyle,
  drawerHeight,
  finished,
  velocity
}: {
  animation: Animated.Value
  value: number
  animationStyle: DrawerAnimationStyle
  drawerHeight: number
  finished?: ({ finished }: { finished: boolean }) => void
  velocity?: number
}) => {
  let tension: number
  let friction: number
  switch (animationStyle) {
    case DrawerAnimationStyle.STIFF:
      tension = 150
      friction = 25
      break
    case DrawerAnimationStyle.SPRINGY:
      // Factor the height of the drawer into the spring physics.
      // Without this, short drawers tend to feel sluggish while
      // tall drawers really get going.
      tension = 70 + 60 * (1 - drawerHeight / FULL_DRAWER_HEIGHT)
      friction = 10 + 2 * (1 - drawerHeight / FULL_DRAWER_HEIGHT)
      break
  }
  Animated.spring(animation, {
    toValue: value,
    tension,
    friction,
    useNativeDriver: true,
    velocity
  }).start(finished)
}

const DrawerHeader = ({
  onClose,
  title,
  titleIcon,
  isFullscreen,
  zIndex
}: {
  onClose: () => void
  title?: string
  titleIcon?: ImageSourcePropType
  isFullscreen?: boolean
  zIndex?: number
}) => {
  const styles = useThemedStyles(createStyles(zIndex))
  const closeColor = useColor('neutralLight4')

  return title || isFullscreen ? (
    <View style={styles.titleBarContainer}>
      {isFullscreen && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.dismissContainer}
        >
          <IconRemove width={30} height={30} fill={closeColor} />
        </TouchableOpacity>
      )}
      {title && (
        <View style={styles.titleContainer}>
          {titleIcon && (
            <Image style={styles.titleIcon as ImageStyle} source={titleIcon} />
          )}
          <Text style={styles.titleLabel}>{title}</Text>
        </View>
      )}
    </View>
  ) : (
    <View />
  )
}

// Only allow titleIcon with title
type DrawerComponent = {
  (props: DrawerProps & { title: string }): React.ReactElement
  (props: Omit<DrawerProps, 'titleIcon'>): React.ReactElement
}
export const Drawer: DrawerComponent = ({
  isOpen,
  children,
  onClose,
  onClosed,
  onOpen,
  title,
  titleIcon,
  isFullscreen,
  shouldBackgroundDim = true,
  isGestureSupported = true,
  animationStyle = DrawerAnimationStyle.SPRINGY,
  initialOffsetPosition = 0,
  shouldCloseToInitialOffset,
  shouldHaveRoundedBordersAtInitialOffset = false,
  zIndex,
  drawerStyle,
  shouldAnimateShadow,
  onPercentOpen,
  onPanResponderMove,
  translationAnim: providedTranslationAnim,
  disableSafeAreaView
}: DrawerProps) => {
  const styles = useThemedStyles(createStyles(zIndex, shouldAnimateShadow))
  const androidNavigationBarHeight = useSelector(getAndroidNavigationBarHeight)

  const [drawerHeight, setDrawerHeight] = useState(
    isFullscreen ? FULL_DRAWER_HEIGHT : 0
  )
  // isBackgroundVisible will be true until the close animation finishes
  const [isBackgroundVisible, setIsBackgroundVisible] = useState(false)

  // Initial position of the drawer when closed
  const initialPosition = FULL_DRAWER_HEIGHT
  // Position of the drawer when it is in an offset but closed state
  const initialOffsetOpenPosition = FULL_DRAWER_HEIGHT - initialOffsetPosition
  // Position of the fully opened drawer
  const openPosition = FULL_DRAWER_HEIGHT - drawerHeight

  const newTranslationAnim = useRef(new Animated.Value(initialPosition)).current
  const translationAnim = providedTranslationAnim || newTranslationAnim

  const shadowAnim = useRef(new Animated.Value(0)).current
  const borderRadiusAnim = useRef(new Animated.Value(BORDER_RADIUS)).current
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current

  // Capture the intent of opening the drawer (for use in pan responder release).
  // Generally when releasing a pan responder, we don't want to update state until
  // the resulting animation has completed. The completion of that animation may be
  // well after the user has started yet another pan gesture though, and we definitely
  // want to capture the users previous intent so that our next pan gesture can be
  // handled properly.
  const isOpenIntent = useRef(isOpen)

  const slideIn = useCallback(
    (position: number, velocity?: number, onFinished?: () => void) => {
      springToValue({
        animation: translationAnim,
        value: position,
        animationStyle,
        drawerHeight,
        velocity,
        finished: ({ finished }) => {
          if (finished) {
            onFinished?.()
          }
        }
      })
      if (isFullscreen) {
        springToValue({
          animation: borderRadiusAnim,
          value: 0,
          drawerHeight,
          animationStyle,
          velocity
        })
      }
      if (shouldBackgroundDim) {
        springToValue({
          animation: shadowAnim,
          value: MAX_SHADOW_OPACITY,
          drawerHeight,
          animationStyle
        })
        springToValue({
          animation: backgroundOpacityAnim,
          value: BACKGROUND_OPACITY,
          drawerHeight,
          animationStyle
        })
      }
    },
    [
      translationAnim,
      shadowAnim,
      backgroundOpacityAnim,
      borderRadiusAnim,
      shouldBackgroundDim,
      isFullscreen,
      animationStyle,
      drawerHeight
    ]
  )

  const slideOut = useCallback(
    (position: number, velocity?: number, onFinished?: () => void) => {
      springToValue({
        animation: translationAnim,
        value: position,
        drawerHeight,
        animationStyle,
        finished: ({ finished }) => {
          if (finished) {
            setIsBackgroundVisible(false)
            onClosed?.()
            onFinished?.()
          }
        },
        velocity
      })
      if (isFullscreen) {
        springToValue({
          animation: borderRadiusAnim,
          value: BORDER_RADIUS,
          drawerHeight,
          animationStyle
        })
      }
      if (shouldBackgroundDim) {
        springToValue({
          animation: shadowAnim,
          value: 0,
          drawerHeight,
          animationStyle
        })
        springToValue({
          animation: backgroundOpacityAnim,
          value: 0,
          drawerHeight,
          animationStyle
        })
      }
    },
    [
      translationAnim,
      shadowAnim,
      backgroundOpacityAnim,
      borderRadiusAnim,
      isFullscreen,
      shouldBackgroundDim,
      animationStyle,
      onClosed,
      drawerHeight
    ]
  )

  useEffect(() => {
    if (isOpen) {
      isOpenIntent.current = true
      slideIn(openPosition)
      setIsBackgroundVisible(true)
    } else {
      isOpenIntent.current = false
      if (!isOpen && shouldCloseToInitialOffset) {
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
    shouldCloseToInitialOffset,
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
      if (
        isOpen ||
        isOpenIntent.current ||
        (!isOpen && shouldCloseToInitialOffset)
      ) {
        if (gestureState.dy > 0) {
          // Dragging downwards
          // Bound percentOpen to [0, 1]
          const percentOpen =
            (drawerHeight -
              (!isOpenIntent.current ? drawerHeight : gestureState.dy)) /
            drawerHeight

          if (isOpenIntent.current) {
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
              const borderRadiusInitialOffset =
                shouldHaveRoundedBordersAtInitialOffset
                  ? // Border radius has rounded corners at the initial offset
                    BORDER_RADIUS
                  : // Border radius gains radius (quicklky) as the initial offset is
                    // left and the drawer drags open
                    BORDER_RADIUS * percentOpen * 5
              // Cap the border radius at the maximum (BORDER_RADIUS)
              let newBorderRadius = Math.min(
                borderRadiusInitialOffset,
                BORDER_RADIUS
              )
              // On non-iOS platforms, bring the border radius back to 0 at the fully open state
              if (Platform.OS !== 'ios') {
                newBorderRadius = Math.min(
                  newBorderRadius,
                  BORDER_RADIUS * 2 * (1 - percentOpen)
                )
              }
              attachToDy(borderRadiusAnim, newBorderRadius)(e)
            }
          }

          // Dragging downwards with an initial offset
          if (!isOpenIntent.current && shouldCloseToInitialOffset) {
            const newTranslation =
              initialOffsetOpenPosition + gestureState.dy / OVERFLOW_FRICTION
            attachToDy(translationAnim, newTranslation)(e)
          }

          if (onPercentOpen) onPercentOpen(percentOpen)
        } else if (gestureState.dy < 0) {
          // Dragging upwards
          // Bound percentOpen to [0, 1]
          const percentOpen =
            (-1 *
              (isOpenIntent.current ? -1 * drawerHeight : gestureState.dy)) /
            drawerHeight

          if (isOpenIntent.current) {
            const newTranslation =
              openPosition + gestureState.dy / OVERFLOW_FRICTION
            attachToDy(translationAnim, newTranslation)(e)
          }

          // Dragging upwards with an initial offset
          if (!isOpenIntent.current && shouldCloseToInitialOffset) {
            const newTranslation = initialOffsetOpenPosition + gestureState.dy
            attachToDy(translationAnim, newTranslation)(e)

            // Set up border animations so that
            // - In the offset position, they are either 0 or BORDER_RADIUS
            // - While dragging open, they have BORDER_RADIUS
            // - While fully open, they are 0
            const borderRadiusInitialOffset =
              shouldHaveRoundedBordersAtInitialOffset
                ? BORDER_RADIUS
                : BORDER_RADIUS * percentOpen * 5
            let newBorderRadius = Math.min(
              borderRadiusInitialOffset,
              BORDER_RADIUS
            )
            // On non-iOS platforms, bring the border radius back to 0 at the fully open state
            if (Platform.OS !== 'ios') {
              newBorderRadius = Math.min(
                newBorderRadius,
                BORDER_RADIUS * 2 * (1 - percentOpen)
              )
            }

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
      if (
        isOpen ||
        isOpenIntent.current ||
        (!isOpen && shouldCloseToInitialOffset)
      ) {
        // Close if open & drag is past cutoff
        if (
          gestureState.vy > 0 &&
          gestureState.moveY >
            FULL_DRAWER_HEIGHT - MOVE_CUTOFF_CLOSE * drawerHeight
        ) {
          if (shouldCloseToInitialOffset) {
            slideOut(initialOffsetOpenPosition, gestureState.vy, onClose)
            isOpenIntent.current = false
            borderRadiusAnim.setValue(0)
          } else {
            slideOut(initialPosition, gestureState.vy, onClose)
            isOpenIntent.current = false
          }
        } else {
          slideIn(openPosition, gestureState.vy, onOpen)
          isOpenIntent.current = true
          // If an initial offset is defined, clear the border radius
          if (
            shouldHaveRoundedBordersAtInitialOffset &&
            initialOffsetOpenPosition
          ) {
            borderRadiusAnim.setValue(0)
          }
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
    const renderBackgroundView = (options?: { pointerEvents: 'none' }) => (
      <Animated.View
        pointerEvents={options?.pointerEvents}
        style={[styles.background, { opacity: backgroundOpacityAnim }]}
      />
    )
    // The background should be visible and touchable when the drawer is open
    if (isOpen) {
      return (
        <TouchableWithoutFeedback
          onPress={() => {
            onClose()
          }}
        >
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

  const renderContent = () => {
    const ViewComponent = disableSafeAreaView ? View : SafeAreaView

    const edgeProps = disableSafeAreaView
      ? undefined
      : {
          edges: ['bottom', ...(isFullscreen ? ['top'] : [])] as Edge[]
        }

    return (
      <ViewComponent
        style={isFullscreen ? styles.fullScreenContent : styles.content}
        onLayout={(event: LayoutChangeEvent) => {
          if (!isFullscreen) {
            const { height } = event.nativeEvent.layout
            setDrawerHeight(height + androidNavigationBarHeight)
          }
        }}
        {...edgeProps}
      >
        <DrawerHeader
          onClose={onClose}
          title={title}
          titleIcon={titleIcon}
          isFullscreen={isFullscreen}
        />
        {children}
      </ViewComponent>
    )
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
            shadowOpacity: shouldAnimateShadow
              ? shadowAnim
              : MAX_SHADOW_OPACITY,
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
        {renderContent()}
        <View style={styles.skirt} />
      </Animated.View>
    </>
  )
}

export default Drawer
