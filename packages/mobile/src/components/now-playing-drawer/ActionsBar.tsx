import { useCallback, useLayoutEffect } from 'react'

import { useGatedContentAccess } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  ModalSource
} from '@audius/common/models'
import type { Track } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  castSelectors,
  castActions,
  reachabilitySelectors,
  tracksSocialActions,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  OverflowAction,
  OverflowSource,
  usePremiumContentPurchaseModal,
  playbackPositionSelectors,
  PurchaseableContentType
} from '@audius/common/store'
import { formatPrice, Genre, removeNullable } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { View, Platform } from 'react-native'
import { CastButton } from 'react-native-google-cast'
import { useDispatch, useSelector } from 'react-redux'
import { trpc } from 'utils/trpcClientWeb'

import {
  IconButton,
  IconCastAirplay,
  IconCastChromecast,
  IconKebabHorizontal,
  IconShare
} from '@audius/harmony-native'
import { useAirplay } from 'app/components/audio/Airplay'
import { Button } from 'app/components/core'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { FavoriteButton } from './FavoriteButton'
import { RepostButton } from './RepostButton'

const { getAccountUser } = accountSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const { updateMethod } = castActions
const { getMethod: getCastMethod, getIsCasting } = castSelectors
const { getTrackPosition } = playbackPositionSelectors

const { getIsReachable } = reachabilitySelectors

const messages = {
  repostProhibited: "You can't Repost your own Track!",
  favoriteProhibited: "You can't Favorite your own Track!",
  castLabel: 'Cast to Device',
  shareLabel: 'Share Content',
  optionsLabel: 'More Options'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    marginTop: spacing(10),
    height: spacing(12),
    flexDirection: 'row',
    gap: spacing(2)
  },
  actions: {
    borderRadius: 10,
    height: spacing(12),
    backgroundColor: palette.neutralLight8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexGrow: 1
  },
  button: {
    flexGrow: 1,
    alignItems: 'center'
  },
  buyButton: {
    backgroundColor: palette.specialLightGreen
  },
  animatedIcon: {
    width: spacing(7),
    height: spacing(7)
  },
  icon: {
    width: spacing(6),
    height: spacing(6)
  }
}))

type ActionsBarProps = {
  track: Nullable<Track>
}

export const ActionsBar = ({ track }: ActionsBarProps) => {
  const styles = useStyles()
  const { toast } = useToast()
  const castMethod = useSelector(getCastMethod)
  const isCasting = useSelector(getIsCasting)
  const accountUser = useSelector(getAccountUser)
  const { neutral, neutralLight6, primary } = useThemeColors()
  const dispatch = useDispatch()
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const isReachable = useSelector(getIsReachable)
  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )

  const isOwner = track?.owner_id === accountUser?.user_id
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()

  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId: track?.track_id ?? 0 },
    { enabled: !!track?.track_id }
  )

  const handlePurchasePress = useCallback(() => {
    if (track?.track_id) {
      openPremiumContentPurchaseModal(
        {
          contentId: track.track_id,
          contentType: PurchaseableContentType.TRACK
        },
        { source: ModalSource.NowPlaying }
      )
    }
  }, [track?.track_id, openPremiumContentPurchaseModal])
  const { hasStreamAccess } = useGatedContentAccess(track)
  const shouldShowPurchasePill =
    track?.stream_conditions &&
    'usdc_purchase' in track.stream_conditions &&
    !hasStreamAccess

  useLayoutEffect(() => {
    if (Platform.OS === 'android' && castMethod === 'airplay') {
      dispatch(updateMethod({ method: 'chromecast' }))
    }
  }, [castMethod, dispatch])

  const handleFavorite = useCallback(() => {
    if (track) {
      if (track.has_current_user_saved) {
        dispatch(unsaveTrack(track.track_id, FavoriteSource.NOW_PLAYING))
      } else if (isOwner) {
        toast({ content: messages.favoriteProhibited })
      } else {
        dispatch(saveTrack(track.track_id, FavoriteSource.NOW_PLAYING))
      }
    }
  }, [dispatch, isOwner, toast, track])

  const handleRepost = useCallback(() => {
    if (track) {
      if (track.has_current_user_reposted) {
        dispatch(undoRepostTrack(track.track_id, RepostSource.NOW_PLAYING))
      } else if (isOwner) {
        toast({ content: messages.repostProhibited })
      } else {
        dispatch(repostTrack(track.track_id, RepostSource.NOW_PLAYING))
      }
    }
  }, [dispatch, isOwner, toast, track])

  const handleShare = useCallback(() => {
    if (track) {
      dispatch(
        requestOpenShareModal({
          type: 'track',
          trackId: track.track_id,
          source: ShareSource.NOW_PLAYING
        })
      )
    }
  }, [dispatch, track])

  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, {
      trackId: track?.track_id,
      userId: accountUser?.user_id
    })
  )
  const onPressOverflow = useCallback(() => {
    if (track) {
      const isLongFormContent =
        track.genre === Genre.PODCASTS || track.genre === Genre.AUDIOBOOKS
      const overflowActions = [
        isEditAlbumsEnabled && isOwner ? OverflowAction.ADD_TO_ALBUM : null,
        !track.is_stream_gated ? OverflowAction.ADD_TO_PLAYLIST : null,
        isNewPodcastControlsEnabled && isLongFormContent
          ? OverflowAction.VIEW_EPISODE_PAGE
          : OverflowAction.VIEW_TRACK_PAGE,
        isEditAlbumsEnabled && albumInfo
          ? OverflowAction.VIEW_ALBUM_PAGE
          : null,
        isNewPodcastControlsEnabled && isLongFormContent
          ? playbackPositionInfo?.status === 'COMPLETED'
            ? OverflowAction.MARK_AS_UNPLAYED
            : OverflowAction.MARK_AS_PLAYED
          : null,
        OverflowAction.VIEW_ARTIST_PAGE
      ].filter(removeNullable)

      dispatch(
        openOverflowMenu({
          source: OverflowSource.TRACKS,
          id: track.track_id,
          overflowActions
        })
      )
    }
  }, [
    track,
    isEditAlbumsEnabled,
    isOwner,
    isNewPodcastControlsEnabled,
    albumInfo,
    playbackPositionInfo?.status,
    dispatch
  ])

  const { openAirplayDialog } = useAirplay()

  const renderPurchaseButton = () => {
    if (
      track?.stream_conditions &&
      'usdc_purchase' in track.stream_conditions
    ) {
      const price = track.stream_conditions.usdc_purchase.price
      return (
        <Button
          style={styles.buyButton}
          styles={{ icon: { width: spacing(4), height: spacing(4) } }}
          title={`$${formatPrice(price)}`}
          size='large'
          onPress={handlePurchasePress}
        />
      )
    }
  }

  const renderCastButton = () => {
    if (castMethod === 'airplay') {
      return (
        <IconButton
          onPress={openAirplayDialog}
          icon={IconCastAirplay}
          color={isCasting ? 'active' : 'default'}
          size='l'
          aria-label={messages.castLabel}
          style={styles.button}
        />
      )
    }
    return isOfflineModeEnabled && !isReachable ? (
      <View style={{ ...styles.button, width: 24 }}>
        <IconCastChromecast
          fill={neutralLight6}
          height={30}
          width={30}
          style={{ transform: [{ scaleX: -1 }] }}
        />
      </View>
    ) : (
      <CastButton
        style={{
          ...styles.button,
          ...styles.icon,
          tintColor: isCasting ? primary : neutral
        }}
      />
    )
  }

  const renderRepostButton = () => {
    return (
      <RepostButton
        iconIndex={track?.has_current_user_reposted ? 1 : 0}
        onPress={handleRepost}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
        isDisabled={!isReachable}
        isOwner={track?.owner_id === accountUser?.user_id}
      />
    )
  }

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
        iconIndex={track?.has_current_user_saved ? 1 : 0}
        onPress={handleFavorite}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
        isOwner={track?.owner_id === accountUser?.user_id}
      />
    )
  }

  const renderShareButton = () => {
    return (
      <IconButton
        icon={IconShare}
        onPress={handleShare}
        size='l'
        aria-label={messages.shareLabel}
        style={styles.button}
      />
    )
  }

  const renderOptionsButton = () => {
    return (
      <IconButton
        icon={IconKebabHorizontal}
        onPress={onPressOverflow}
        size='l'
        disabled={!isReachable}
        aria-label={messages.optionsLabel}
        style={styles.button}
      />
    )
  }

  return (
    <View style={styles.container}>
      {shouldShowPurchasePill ? renderPurchaseButton() : null}
      <View style={styles.actions}>
        {!shouldShowPurchasePill ? renderCastButton() : null}
        {!shouldShowPurchasePill ? renderRepostButton() : null}
        {!shouldShowPurchasePill ? renderFavoriteButton() : null}
        {renderShareButton()}
        {renderOptionsButton()}
      </View>
    </View>
  )
}
