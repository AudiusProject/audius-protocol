import { Animated, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

import { NOW_PLAYING_HEIGHT } from './constants'

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
   * Percentage "complete" the tracker should render to be
   * (i.e. song % completion). Expressed as a number [0, 1]
   */
  percentComplete: number
  /**
   * Animation that signals how "open" the now playing drawer is.
   */
  translationAnim: Animated.Value
}

export const TrackingBar = ({
  percentComplete,
  translationAnim
}: TrackingBarProps) => {
  const styles = useThemedStyles(createStyles)
  const { primaryLight2, primaryDark2 } = useThemeColors()
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
