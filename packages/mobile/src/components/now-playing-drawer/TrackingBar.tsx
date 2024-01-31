import { playerSelectors } from '@audius/common/store'
import { useCallback, useEffect, useRef } from 'react'

import { Animated, Dimensions, Easing } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import TrackPlayer from 'react-native-track-player'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { NOW_PLAYING_HEIGHT } from './constants'

const width = Dimensions.get('window').width

const { getSeek, getPlaying, getPaused } = playerSelectors

const useStyles = makeStyles(({ palette }) => ({
  rail: {
    height: 2,
    width: '100%',
    backgroundColor: palette.neutralLight7,
    overflow: 'hidden'
  },
  tracker: {
    height: 3,
    // flexGrow: 1,
    backgroundColor: 'red'
  }
}))

type TrackingBarProps = {
  /**
   * A unique key to represent this instances of playback.
   * If the user replays the same track, mediaKey should change
   */
  mediaKey: string
  duration: number
  /**
   * Animation that signals how "open" the now playing drawer is.
   */
  translateYAnimation: Animated.Value
}

export const TrackingBar = (props: TrackingBarProps) => {
  const { mediaKey, duration, translateYAnimation } = props
  const styles = useStyles()
  const { primaryLight2, primaryDark2 } = useThemeColors()

  const translateXAnimation = useRef(new Animated.Value(0))
  const currentAnimation = useRef<Animated.CompositeAnimation>()

  const seek = useSelector(getSeek) ?? 0
  const playing = useSelector(getPlaying)
  const paused = useSelector(getPaused)

  const runTranslateXAnimation = useCallback((timeRemaining: number) => {
    currentAnimation.current = Animated.timing(translateXAnimation.current, {
      toValue: 1,
      duration: timeRemaining * 1000,
      easing: Easing.linear,
      // Can't use native driver because this animation is potentially hours long,
      // and would have to be serialized into an array to be passed to the native layer.
      // The array exceeds the number of properties allowed in hermes
      useNativeDriver: false
    })

    currentAnimation.current.start()
  }, [])

  useEffect(() => {
    if (duration) {
      translateXAnimation.current.setValue(0)
      runTranslateXAnimation(duration)
    }
  }, [mediaKey, duration, runTranslateXAnimation])

  useAsync(async () => {
    if (paused) {
      currentAnimation.current?.stop()
    } else if (playing) {
      const position = await TrackPlayer.getPosition()
      runTranslateXAnimation(duration - position)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- no duration
  }, [playing, paused, runTranslateXAnimation])

  useEffect(() => {
    const percentComplete = duration === 0 ? 0 : seek / duration
    const timeRemaining = duration - seek

    translateXAnimation.current.setValue(percentComplete)

    if (playing) {
      runTranslateXAnimation(timeRemaining)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- no duration
  }, [seek, runTranslateXAnimation])

  const rootOpacity = translateYAnimation.interpolate({
    // Interpolate the animation such that the tracker fades out
    // at 5% up the screen.
    // The tracker is important to fade away shortly after
    // the now playing drawer is opened so that the drawer may
    // animate in corner radius without showing at the same time
    // as the tracker.
    inputRange: [0, 0.9 * NOW_PLAYING_HEIGHT, NOW_PLAYING_HEIGHT],
    outputRange: [0, 0, 2]
  })

  const trackerTransform = [
    {
      translateX: translateXAnimation.current.interpolate({
        inputRange: [0, 1],
        outputRange: [-1 * width, 0]
      })
    }
  ]

  return (
    <Animated.View style={[styles.rail, { opacity: rootOpacity }]}>
      <Animated.View style={[styles.tracker, { transform: trackerTransform }]}>
        <LinearGradient
          useAngle
          angle={135}
          colors={[primaryLight2, primaryDark2]}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  )
}
