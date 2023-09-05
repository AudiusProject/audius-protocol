import { useEffect, useRef, useState } from 'react'

import { Animated, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

import { NOW_PLAYING_HEIGHT } from './constants'

const SEEK_INTERVAL = 200

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    rail: {
      height: 2,
      width: '100%',
      backgroundColor: themeColors.neutralLight7
    },
    tracker: {
      height: 2,
      backgroundColor: 'red'
    }
  })

type TrackingBarProps = {
  /**
   * Animation that signals how "open" the now playing drawer is.
   */
  translationAnim: Animated.Value
}

export const TrackingBar = ({ translationAnim }: TrackingBarProps) => {
  const styles = useThemedStyles(createStyles)
  const { primaryLight2, primaryDark2 } = useThemeColors()

  const [percentComplete, setPercentComplete] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const { currentTime, seekableDuration } = global.progress
      if (seekableDuration !== undefined) {
        setPercentComplete(currentTime / seekableDuration)
      } else {
        setPercentComplete(0)
      }
    }, SEEK_INTERVAL)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [setPercentComplete, intervalRef])

  return (
    <Animated.View
      style={[
        styles.rail,
        {
          opacity: translationAnim.interpolate({
            // Interpolate the animation such that the tracker fades out
            // at 5% up the screen.
            // The tracker is important to fade away shortly after
            // the now playing drawer is opened so that the drawer may
            // animate in corner radius without showing at the same time
            // as the tracker.
            inputRange: [0, 0.9 * NOW_PLAYING_HEIGHT, NOW_PLAYING_HEIGHT],
            outputRange: [0, 0, 2]
          })
        }
      ]}
    >
      <View
        style={[
          styles.tracker,
          {
            width: `${percentComplete * 100}%`
          }
        ]}
      >
        <LinearGradient
          useAngle
          angle={135}
          colors={[primaryLight2, primaryDark2]}
          style={{ flex: 1 }}
        />
      </View>
    </Animated.View>
  )
}
