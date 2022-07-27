import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { useAppState } from '@react-native-community/hooks'
import type { GestureResponderEvent } from 'react-native'
import { StyleSheet, View, Animated, PanResponder } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { attachToDx } from 'app/utils/animation'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

// How much the handle "grows" when pressing
const HANDLE_GROW_SCALE = 1.1

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      height: 4,
      marginLeft: 16,
      marginRight: 16,
      flexGrow: 1
    },
    rail: {
      backgroundColor: themeColors.neutralLight8,
      borderRadius: 2,
      borderColor: themeColors.neutralLight8,
      height: 4,
      overflow: 'hidden'
    },
    tracker: {
      // The tracker must be the full width of the rail
      // so that it can have rounded edges. It animates
      // by sliding (translateX) instead of by growing.
      flexGrow: 1,
      backgroundColor: themeColors.neutral,
      borderRadius: 2,
      borderColor: themeColors.neutralLight8,
      height: 4
    },
    handleContainer: {
      top: -6,
      position: 'absolute'
    },
    handle: {
      marginLeft: -8,
      height: 16,
      width: 16,
      borderRadius: 8,
      backgroundColor: themeColors.staticWhite,
      // Note: React-native-shadow-2 seems to lose fidelity
      // when styling such a small shadow.
      // TODO: Revisit this, but as of writing, these values
      // are fairly good on android/ios
      shadowColor: 'rgb(133,129,153)',
      shadowOffset: {
        width: 0,
        height: 1
      },
      shadowOpacity: 0.5,
      shadowRadius: 2,
      elevation: 3
    }
  })

type SliderProps = {
  /**
   * A unique key to represent this instances of playback.
   * If the user replays the same track, mediaKey should change
   */
  mediaKey: string
  /**
   * Whether audio is playing and the scrubber should animate
   */
  isPlaying: boolean
  /**
   * The duration of the currently playing track
   */
  duration: number
  /**
   * Callback invoked when focus is gained on the scrubber
   */
  onPressIn: () => void
  /**
   * Callback invoked when focus is lost on the scrubber
   */
  onPressOut: (percentComplete: number) => void
  /**
   * Callback invoked when dragging on the scrubber. A drag
   * begins by grabbing the handle or pressing the rail
   * and then dragging.
   */
  onDrag: (percentComplete: number) => void
}

/**
 * Slider is an internal component of Scrubber (without the timestamps).
 * It is separated as a different component so that it can be memoized
 * independently in such a way where dragging the Slider does not cause
 * re-renders of itself, despite having to update external timestamps on "drag."
 */
export const Slider = memo(
  ({
    mediaKey,
    isPlaying,
    duration,
    onPressIn,
    onPressOut,
    onDrag
  }: SliderProps) => {
    const styles = useThemedStyles(createStyles)
    const { primaryLight2, primaryDark2 } = useThemeColors()

    // Animation to translate the handle and tracker
    const translationAnim = useRef(new Animated.Value(0)).current
    // Scale animation for the handle
    const {
      scale: handleScale,
      handlePressIn: handlePressHandleIn,
      handlePressOut: handlePressHandleOut
    } = usePressScaleAnimation(HANDLE_GROW_SCALE)

    const railRef = useRef<View>()
    // The rail component's width
    const [railWidth, setRailWidth] = useState(0)
    // The rail component's distance from the left
    const [railPageX, setRailPageX] = useState(0)
    // The position of the drag-handle
    const [handlePosition, setHandlePosition] = useState(0)

    const getRailPageX = () => {
      if (railRef.current) {
        railRef.current.measure((x, y, width, height, pageX, pageY) => {
          setRailPageX(pageX)
        })
      }
    }

    useEffect(getRailPageX, [railRef])

    const currentAnimation = useRef<Animated.CompositeAnimation>()
    const play = useCallback(
      (timeRemaining: number) => {
        currentAnimation.current = Animated.timing(translationAnim, {
          toValue: railWidth,
          duration: timeRemaining,
          useNativeDriver: true
        })
        currentAnimation.current.start()
      },
      [translationAnim, railWidth]
    )

    const pause = useCallback(() => {
      currentAnimation.current?.stop()
    }, [currentAnimation])

    const onPressRail = useCallback(
      (e: GestureResponderEvent) => {
        // Use the pageX from the native event to determine where
        // the press was. Unfortunately locationX reports
        // inconsistent results because of the animation
        const newPosition = e.nativeEvent.pageX - railPageX
        setHandlePosition(newPosition)
        Animated.timing(translationAnim, {
          duration: 100,
          toValue: newPosition,
          useNativeDriver: true
        }).start()
        handlePressHandleIn()
        onPressIn()
      },
      [
        railPageX,
        setHandlePosition,
        translationAnim,
        handlePressHandleIn,
        onPressIn
      ]
    )

    const animateFromNowToEnd = useCallback(
      (percentComplete) => {
        if (isPlaying && duration !== undefined) {
          play((1 - percentComplete) * duration * 1000)
        }
      },
      [isPlaying, duration, play]
    )

    const onReleaseRail = useCallback(
      (e: GestureResponderEvent) => {
        const newPosition = e.nativeEvent.pageX - railPageX
        const percentComplete = newPosition / railWidth
        onPressOut(percentComplete)
        handlePressHandleOut()
        animateFromNowToEnd(percentComplete)
      },
      [
        onPressOut,
        handlePressHandleOut,
        railPageX,
        railWidth,
        animateFromNowToEnd
      ]
    )

    const onPressHandle = useCallback(
      (event: GestureResponderEvent) => {
        const newPosition = event.nativeEvent.pageX - railPageX
        setHandlePosition(newPosition)
        onPressIn()
        handlePressHandleIn()
        pause()
      },
      [onPressIn, handlePressHandleIn, pause, railPageX]
    )

    const onReleaseHandle = useCallback(
      (percentComplete) => {
        onPressOut(percentComplete)
        animateFromNowToEnd(percentComplete)
      },
      [onPressOut, animateFromNowToEnd]
    )

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        return true
      },
      onPanResponderMove: (e, gestureState) => {
        const newPosition = Math.max(
          0,
          Math.min(gestureState.dx + handlePosition, railWidth)
        )
        attachToDx(translationAnim, newPosition)(e)
        onDrag(newPosition / railWidth)
      },
      onPanResponderRelease: (e, gestureState) => {
        const newPosition = Math.max(
          0,
          Math.min(gestureState.dx + handlePosition, railWidth)
        )
        attachToDx(translationAnim, newPosition)(e)
        setHandlePosition(newPosition)
        onReleaseHandle(newPosition / railWidth)
      }
    })

    // When the media key changes, reset the scrubber
    useEffect(() => {
      translationAnim.setValue(0)
      setHandlePosition(0)
    }, [mediaKey, translationAnim])

    // When playing starts, start the scrubber animation.
    // When playing stops, pause the scrubber animation.
    const prevMediaKey = useRef<string>(mediaKey)
    const durationRef = useRef<number>(duration)
    useEffect(() => {
      durationRef.current = duration
    }, [duration])

    useEffect(() => {
      if (isPlaying) {
        if (durationRef.current !== undefined) {
          if (mediaKey !== prevMediaKey.current) {
            // New media key, playback starts at 0
            play(durationRef.current * 1000)
            prevMediaKey.current = mediaKey
          } else {
            const { currentTime } = global.progress
            play((durationRef.current - currentTime) * 1000)
          }
        }
      } else {
        pause()
      }
    }, [isPlaying, play, pause, mediaKey, durationRef])

    const appState = useAppState()

    /**
     * Ensures the slider handle's position is correctly updated when app
     * becomes active.
     */
    useEffect(() => {
      if (appState === 'active') {
        const { currentTime } = global.progress
        const percentComplete = currentTime / durationRef.current
        translationAnim.setValue(percentComplete * railWidth)
        setHandlePosition(percentComplete * railWidth)
        if (isPlaying && durationRef.current !== undefined) {
          play((durationRef.current - currentTime) * 1000)
        }
      }
    }, [isPlaying, appState, play, railWidth, translationAnim])

    return (
      <View style={styles.root}>
        <Animated.View
          ref={railRef}
          {...panResponder.panHandlers}
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout
            setRailWidth(width)
            getRailPageX()
          }}
          style={styles.rail}
          onTouchStart={onPressRail}
          onTouchEnd={onReleaseRail}
          hitSlop={{ top: 8, bottom: 8 }}>
          <Animated.View
            style={[
              styles.tracker,
              {
                transform: [
                  {
                    translateX: translationAnim.interpolate({
                      inputRange: [0, railWidth],
                      outputRange: [-1 * railWidth, 0]
                    })
                  }
                ]
              }
            ]}>
            {/* While dragging, show the gradient tracker */}
            <Animated.View
              style={[
                {
                  flex: 1,
                  // Interpolate the handle scale animation to
                  // capture the same timing/easing for the fade in
                  // of the tracker.
                  opacity: handleScale.interpolate({
                    inputRange: [1, HANDLE_GROW_SCALE],
                    outputRange: [0, 1]
                  })
                }
              ]}>
              <LinearGradient
                useAngle
                angle={135}
                colors={[primaryLight2, primaryDark2]}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.handleContainer,
            { transform: [{ translateX: translationAnim }] }
          ]}>
          <Animated.View
            onTouchStart={onPressHandle}
            onTouchEnd={handlePressHandleOut}
            hitSlop={{ top: 16, bottom: 16, right: 16, left: 16 }}
            style={[styles.handle, { transform: [{ scale: handleScale }] }]}
          />
        </Animated.View>
      </View>
    )
  }
)
