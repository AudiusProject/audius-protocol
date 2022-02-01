import { useCallback, useEffect, useState } from 'react'

import { FavoriteSource } from 'audius-client/src/common/models/Analytics'
import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { Track } from 'audius-client/src/common/models/Track'
import { getTrack } from 'audius-client/src/common/store/cache/tracks/selectors'
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
import DynamicImage from 'app/components/dynamic-image'
import FavoriteButton from 'app/components/favorite-button'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { pause, play } from 'app/store/audio/actions'
import {
  getPlaying,
  getTrack as getNativeTrack
} from 'app/store/audio/selectors'
import { Theme, ThemeColors, useThemeVariant } from 'app/utils/theme'

import AnimatedButtonProvider from '../animated-button/AnimatedButtonProvider'

import { TrackingBar } from './TrackingBar'

const SEEK_INTERVAL = 1000

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
  onPress: () => void
  /**
   * Opacity animation to fade out play bar as
   * the new playing drawer is dragged open.
   */
  opacityAnim: Animated.Value
}

const PlayBarArtwork = ({ track }: { track: Track }) => {
  const image = useTrackCoverArt(
    track.track_id,
    track._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )
  return <DynamicImage image={{ uri: image }} />
}

export const PlayBar = ({ onPress, opacityAnim }: PlayBarProps) => {
  const styles = useThemedStyles(createStyles)
  const themeVariant = useThemeVariant()
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()

  const isDarkMode = themeVariant === Theme.DARK
  const [percentComplete, setPercentComplete] = useState(0)

  // TODO: As we move away from the audio store slice in mobile-client
  // in favor of player/queue selectors in common, getNativeTrack calls
  // should be replaced
  const trackInfo = useSelector(getNativeTrack)
  const track = useSelectorWeb(state =>
    getTrack(state, trackInfo ? { id: trackInfo.trackId } : {})
  )

  useEffect(() => {
    setInterval(() => {
      const { currentTime, playableDuration } = global.progress
      if (playableDuration !== undefined) {
        setPercentComplete(currentTime / playableDuration)
      } else {
        setPercentComplete(0)
      }
    }, SEEK_INTERVAL)
  }, [setPercentComplete])

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
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconPlay, IconPause]}
        iconDarkJSON={[IconPlay, IconPause]}
        onPress={onPressPlayButton}
        isActive={isPlaying}
        style={styles.button}
        wrapperStyle={styles.playIcon}
      />
    )
  }

  const onPressFavoriteButton = useCallback(() => {
    if (track) {
      if (track.has_current_user_saved) {
        dispatchWeb(unsaveTrack(track?.track_id, FavoriteSource.PLAYBAR))
      } else {
        dispatchWeb(saveTrack(track?.track_id, FavoriteSource.PLAYBAR))
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
              {trackInfo?.title ?? ''}
            </Text>
            <Text weight='bold' style={styles.separator}>
              •
            </Text>
            <Text numberOfLines={1} weight='medium' style={styles.artist}>
              {trackInfo?.artist ?? ''}
            </Text>
          </View>
        </TouchableOpacity>
        {renderPlayButton()}
      </View>
    </Animated.View>
  )
}
