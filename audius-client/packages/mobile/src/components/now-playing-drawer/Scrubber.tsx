import React, { memo, useCallback, useEffect, useRef, useState } from 'react'

import moment from 'moment'
import {
  StyleSheet,
  View,
  GestureResponderEvent,
  Animated,
  PanResponder
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import Text from 'app/components/text'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

// How much the handle "grows" when pressing
const HANDLE_GROW_SCALE = 1.1

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR

// Pretty formats seconds into m:ss or h:mm:ss
const formatSeconds = (seconds: number) => {
  const utc = moment.utc(moment.duration(seconds, 'seconds').asMilliseconds())
  if (seconds > SECONDS_PER_HOUR) {
    return utc.format('h:mm:ss')
  }
  return utc.format('m:ss')
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    timestamp: {
      color: themeColors.neutral,
      fontSize: 12,
      flexShrink: 1
    },
    slider: {
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

const attachToDx = (animation: Animated.Value, newValue: number) => (
  e: GestureResponderEvent
) => {
  Animated.event(
    [
      null,
      {
        dx: animation
      }
    ],
    { useNativeDriver: false }
  )(e, { dx: newValue })
}

type ScrubberProps = {
  mediaKey: string
}

/**
 * Scrubber component to control track playback & seek.
 *
 * Memoize because the Scrubber is sensitive to parent rerenders
 * due to its gesture handler use.
 * useSelectorWeb (used to connect the now playing drawer) induces
 * rerenders that normally should be harmless.
 */
export const Scrubber = memo(({ mediaKey }: ScrubberProps) => {
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

  useEffect(() => {
    if (railRef.current) {
      railRef.current.measure((x, y, width, height, pageX, pageY) => {
        setRailPageX(pageX)
      })
    }
  }, [railRef])

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
    },
    [railPageX, setHandlePosition, translationAnim, handlePressHandleIn]
  )

  const onReleaseRail = () => {
    handlePressHandleOut()
  }

  const onPressHandle = () => {
    handlePressHandleIn()
  }

  const onReleaseHandle = () => {
    handlePressHandleOut()
  }

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
    },
    onPanResponderRelease: (e, gestureState) => {
      const newPosition = Math.max(
        0,
        Math.min(gestureState.dx + handlePosition, railWidth)
      )
      attachToDx(translationAnim, newPosition)(e)
      setHandlePosition(newPosition)
    }
  })

  const [timestampStart, setTimestampStart] = useState('')
  const [timestampEnd, setTimestampEnd] = useState('')
  useEffect(() => {
    if (global.progress) {
      const { currentTime, playableDuration } = global.progress
      if (currentTime && playableDuration) {
        setTimestampStart(formatSeconds(currentTime))
        setTimestampEnd(formatSeconds(playableDuration))
      }
    }
  }, [mediaKey])

  return (
    <View style={styles.root}>
      <Text style={styles.timestamp} weight='regular'>
        {timestampStart}
      </Text>
      <View style={styles.slider}>
        <Animated.View
          ref={railRef}
          {...panResponder.panHandlers}
          onLayout={e => {
            const { width } = e.nativeEvent.layout
            setRailWidth(width)
          }}
          style={styles.rail}
          onTouchStart={onPressRail}
          onTouchEnd={onReleaseRail}
          hitSlop={{ top: 8, bottom: 8 }}
        >
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
            ]}
          >
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
              ]}
            >
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
          hitSlop={{ top: 8, bottom: 8, right: 8, left: 8 }}
          style={[
            styles.handleContainer,
            { transform: [{ translateX: translationAnim }] }
          ]}
        >
          <Animated.View
            onTouchStart={onPressHandle}
            onTouchEnd={onReleaseHandle}
            style={[styles.handle, { transform: [{ scale: handleScale }] }]}
          />
        </Animated.View>
      </View>
      <Text style={styles.timestamp} weight='regular'>
        {timestampEnd}
      </Text>
    </View>
  )
})
