import { useCallback, useEffect, useRef, useState } from 'react'

import { FavoriteSource } from 'audius-client/src/common/models/Analytics'
import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import {
  saveTrack,
  unsaveTrack
} from 'audius-client/src/common/store/social/tracks/actions'
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  View,
  Dimensions
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import { DynamicImage, AnimatedButton } from 'app/components/core'
import { FavoriteButton } from 'app/components/favorite-button'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { pause, play } from 'app/store/audio/actions'
import { getPlaying } from 'app/store/audio/selectors'
import { ThemeColors } from 'app/utils/theme'

import { TrackingBar } from './TrackingBar'

const SEEK_INTERVAL = 200

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      width: '100%',
      height: 46,
      alignItems: 'center'
    },
    container: {
      height: '100%',
      width: '100%',
      paddingLeft: 12,
      paddingRight: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start'
    },
    button: {},
    playIcon: {
      width: 32,
      height: 32
    },
    icon: {
      width: 28,
      height: 28
    },
    trackInfo: {
      height: '100%',
      flexShrink: 1,
      flexGrow: 1,
      alignItems: 'center',
      flexDirection: 'row'
    },
    artwork: {
      marginLeft: 12,
      height: 26,
      width: 26,
      overflow: 'hidden',
      backgroundColor: themeColors.neutralLight7,
      borderRadius: 2
    },
    trackText: {
      alignItems: 'center',
      marginLeft: 12,
      flexDirection: 'row'
    },
    title: {
      color: themeColors.neutral,
      maxWidth: Dimensions.get('window').width / 3,
      fontSize: 12
    },
    separator: {
      color: themeColors.neutral,
      marginLeft: 4,
      marginRight: 4,
      fontSize: 16
    },
    artist: {
      color: themeColors.neutral,
      maxWidth: Dimensions.get('window').width / 4,
      fontSize: 12
    }
  })

type PlayBarProps = {
  track: Track
  user: User
  onPress: () => void
  /**
   * Opacity animation to fade out play bar as
   * the new playing drawer is dragged open.
   */
  opacityAnim: Animated.Value
}

const PlayBarArtwork = ({ track }: { track: Track }) => {
  const image = useTrackCoverArt({
    id: track.track_id,
    sizes: track._cover_art_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })
  return <DynamicImage uri={image} />
}

export const PlayBar = ({
  track,
  user,
  onPress,
  opacityAnim
}: PlayBarProps) => {
  const styles = useThemedStyles(createStyles)
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()

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

  const isPlaying = useSelector(getPlaying)

  const onPressPlayButton = useCallback(() => {
    if (isPlaying) {
      dispatch(pause())
    } else {
      dispatch(play())
    }
  }, [isPlaying, dispatch])

  const renderPlayButton = () => {
    return (
      <AnimatedButton
        iconLightJSON={[IconPlay, IconPause]}
        iconDarkJSON={[IconPlay, IconPause]}
        onPress={onPressPlayButton}
        iconIndex={isPlaying ? 1 : 0}
        style={styles.button}
        wrapperStyle={styles.playIcon}
      />
    )
  }

  const onPressFavoriteButton = useCallback(() => {
    if (track) {
      if (track.has_current_user_saved) {
        dispatchWeb(unsaveTrack(track.track_id, FavoriteSource.PLAYBAR))
      } else {
        dispatchWeb(saveTrack(track.track_id, FavoriteSource.PLAYBAR))
      }
    }
  }, [dispatchWeb, track])

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
        onPress={onPressFavoriteButton}
        isActive={track?.has_current_user_saved ?? false}
        style={styles.button}
        wrapperStyle={styles.icon}
      />
    )
  }

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: opacityAnim.interpolate({
            // Interpolate the animation such that the play bar fades out
            // at 25% up the screen.
            inputRange: [0, 0.75, 1],
            outputRange: [0, 0, 1]
          })
        }
      ]}
    >
      <TrackingBar
        percentComplete={percentComplete}
        opacityAnim={opacityAnim}
      />
      <View style={styles.container}>
        {renderFavoriteButton()}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.trackInfo}
          onPress={onPress}
        >
          <View style={styles.artwork}>
            {track && <PlayBarArtwork track={track} />}
          </View>
          <View style={styles.trackText}>
            <Text numberOfLines={1} weight='bold' style={styles.title}>
              {track?.title ?? ''}
            </Text>
            <Text
              weight='bold'
              style={styles.separator}
              accessibilityElementsHidden
            >
              {track ? '•' : ''}
            </Text>
            <Text numberOfLines={1} weight='medium' style={styles.artist}>
              {user?.name ?? ''}
            </Text>
          </View>
        </TouchableOpacity>
        {renderPlayButton()}
      </View>
    </Animated.View>
  )
}
