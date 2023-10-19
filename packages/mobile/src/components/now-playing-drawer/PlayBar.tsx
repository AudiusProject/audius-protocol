import { useCallback } from 'react'

import type { Nullable, Track, User } from '@audius/common'
import {
  SquareSizes,
  FavoriteSource,
  accountSelectors,
  tracksSocialActions,
  usePremiumContentAccess
} from '@audius/common'
import { TouchableOpacity, Animated, View, Dimensions } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconLock from 'app/assets/images/iconLock.svg'
import { FavoriteButton } from 'app/components/favorite-button'
import { TrackImage } from 'app/components/image/TrackImage'
import Text from 'app/components/text'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

import { LockedStatusBadge } from '../core'

import { PlayButton } from './PlayButton'
import { TrackingBar } from './TrackingBar'
import { NOW_PLAYING_HEIGHT, PLAY_BAR_HEIGHT } from './constants'
const { getAccountUser } = accountSelectors
const { saveTrack, unsaveTrack } = tracksSocialActions

const messages = {
  preview: 'PREVIEW'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    width: '100%',
    height: PLAY_BAR_HEIGHT,
    alignItems: 'center',
    zIndex: zIndex.PLAY_BAR
  },
  container: {
    height: '100%',
    width: '100%',
    paddingLeft: spacing(3),
    paddingRight: spacing(3),
    gap: spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  playIcon: {
    width: spacing(8),
    height: spacing(8)
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
    flexDirection: 'row',
    gap: spacing(3)
  },
  artworkContainer: {
    position: 'relative',
    height: 26,
    width: 26,
    borderRadius: 2,
    overflow: 'hidden'
  },
  artwork: {
    height: '100%',
    width: '100%',
    backgroundColor: palette.neutralLight7
  },
  lockOverlay: {
    backgroundColor: '#000',
    opacity: 0.4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    zIndex: 10
  },
  trackText: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  title: {
    color: palette.neutral,
    maxWidth: Dimensions.get('window').width / 3.5,
    fontSize: spacing(3)
  },
  separator: {
    color: palette.neutral,
    marginLeft: spacing(1),
    marginRight: spacing(1),
    fontSize: spacing(4)
  },
  artist: {
    color: palette.neutral,
    maxWidth: Dimensions.get('window').width / 4,
    fontSize: spacing(3)
  }
}))

type PlayBarProps = {
  track: Nullable<Track>
  duration: number
  user: Nullable<User>
  onPress: () => void
  translationAnim: Animated.Value
  mediaKey: string
}

export const PlayBar = (props: PlayBarProps) => {
  const { duration, track, user, onPress, translationAnim, mediaKey } = props
  const styles = useStyles()
  const dispatch = useDispatch()
  const currentUser = useSelector(getAccountUser)
  const staticWhite = useColor('staticWhite')

  const { doesUserHaveAccess } = usePremiumContentAccess(track)
  const shouldShowPreviewLock =
    track?.premium_conditions &&
    'usdc_purchase' in track.premium_conditions &&
    !doesUserHaveAccess

  const onPressFavoriteButton = useCallback(() => {
    if (track) {
      if (track.has_current_user_saved) {
        dispatch(unsaveTrack(track.track_id, FavoriteSource.PLAYBAR))
      } else {
        dispatch(saveTrack(track.track_id, FavoriteSource.PLAYBAR))
      }
    }
  }, [dispatch, track])

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
        isDisabled={
          currentUser?.user_id === track?.owner_id || track?.is_unlisted
        }
        onPress={onPressFavoriteButton}
        isActive={track?.has_current_user_saved ?? false}
        wrapperStyle={styles.icon}
      />
    )
  }

  const rootOpacityAnimation = translationAnim.interpolate({
    // Interpolate the animation such that the play bar fades out
    // at 25% up the screen.
    inputRange: [
      0,
      0.75 * (NOW_PLAYING_HEIGHT - PLAY_BAR_HEIGHT),
      NOW_PLAYING_HEIGHT - PLAY_BAR_HEIGHT
    ],
    outputRange: [0, 0, 1],
    extrapolate: 'extend'
  })

  return (
    <Animated.View style={[styles.root, { opacity: rootOpacityAnimation }]}>
      <TrackingBar
        duration={duration}
        mediaKey={mediaKey}
        translateYAnimation={translationAnim}
      />
      <View style={styles.container}>
        {shouldShowPreviewLock ? null : renderFavoriteButton()}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.trackInfo}
          onPress={onPress}
        >
          {track ? (
            <View style={styles.artworkContainer}>
              {shouldShowPreviewLock ? (
                <View style={styles.lockOverlay}>
                  <IconLock fill={staticWhite} width={10} height={10} />
                </View>
              ) : null}
              <TrackImage
                style={styles.artwork}
                track={track}
                size={SquareSizes.SIZE_150_BY_150}
              />
            </View>
          ) : null}
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
          {shouldShowPreviewLock ? (
            <LockedStatusBadge
              variant='purchase'
              locked
              coloredWhenLocked
              iconSize='small'
              text={messages.preview}
            />
          ) : null}
        </TouchableOpacity>
        <PlayButton wrapperStyle={styles.playIcon} />
      </View>
    </Animated.View>
  )
}
