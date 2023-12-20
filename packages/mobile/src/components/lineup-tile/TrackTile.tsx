import { useCallback } from 'react'

import type { Track, User, CommonState } from '@audius/common'
import {
  playbackPositionSelectors,
  FeatureFlags,
  Genre,
  SquareSizes,
  accountSelectors,
  removeNullable,
  PlaybackSource,
  FavoriteSource,
  RepostSource,
  ShareSource,
  FavoriteType,
  cacheTracksSelectors,
  cacheUsersSelectors,
  tracksSocialActions,
  OverflowAction,
  OverflowSource,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  RepostType,
  playerSelectors,
  isContentUSDCPurchaseGated
} from '@audius/common'
import { useNavigationState } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { TrackImage } from 'app/components/image/TrackImage'
import type { LineupItemProps } from 'app/components/lineup-tile/types'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

import type { TileProps } from '../core'
import type { ImageProps } from '../image/FastImage'

import { LineupTile } from './LineupTile'

const { getUid } = playerSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const { getUserFromTrack } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors
const { getUserId } = accountSelectors
const { getTrackPosition } = playbackPositionSelectors

export const TrackTile = (props: LineupItemProps) => {
  const { uid } = props

  const track = useSelector((state) => getTrack(state, { uid }))

  const user = useSelector((state) => getUserFromTrack(state, { uid }))

  if (!track || !user) {
    console.warn('Track or user missing for TrackTile, preventing render')
    return null
  }

  if (track.is_delete || user?.is_deactivated) {
    return null
  }

  return <TrackTileComponent {...props} track={track} user={user} />
}

type TrackTileProps = LineupItemProps & {
  track: Track
  user: User
  TileProps?: Partial<TileProps>
}

export const TrackTileComponent = ({
  togglePlay,
  track,
  user,
  variant,
  ...lineupTileProps
}: TrackTileProps) => {
  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )

  const isUSDCEnabled = useIsUSDCEnabled()
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const isOnArtistsTracksTab = useNavigationState((state) => {
    // @ts-expect-error -- history returning unknown[]
    const currentScreen = state.history?.[0].key
    return currentScreen?.includes('Tracks')
  })
  const isPlayingUid = useSelector(
    (state: CommonState) => getUid(state) === lineupTileProps.uid
  )

  const currentUserId = useSelector(getUserId)
  const isOwner = currentUserId === track.owner_id

  const {
    duration,
    field_visibility,
    is_unlisted,
    has_current_user_reposted,
    has_current_user_saved,
    play_count,
    title,
    track_id,
    genre,
    is_stream_gated: isStreamGated,
    stream_conditions,
    preview_cid
  } = track

  const hasPreview =
    isUSDCEnabled &&
    isContentUSDCPurchaseGated(stream_conditions) &&
    !!preview_cid

  const renderImage = useCallback(
    (props: ImageProps) => (
      <TrackImage track={track} size={SquareSizes.SIZE_150_BY_150} {...props} />
    ),
    [track]
  )

  const handlePress = useCallback(() => {
    togglePlay({
      uid: lineupTileProps.uid,
      id: track_id,
      source: PlaybackSource.TRACK_TILE
    })
  }, [togglePlay, lineupTileProps.uid, track_id])

  const handlePressTitle = useCallback(() => {
    navigation.push('Track', { id: track_id })
  }, [navigation, track_id])

  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId: track_id, userId: currentUserId })
  )
  const handlePressOverflow = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS

    const overflowActions = [
      isEditAlbumsEnabled && isOwner ? OverflowAction.ADD_TO_ALBUM : null,
      !isStreamGated ? OverflowAction.ADD_TO_PLAYLIST : null,
      isNewPodcastControlsEnabled && isLongFormContent
        ? OverflowAction.VIEW_EPISODE_PAGE
        : OverflowAction.VIEW_TRACK_PAGE,
      isNewPodcastControlsEnabled && isLongFormContent
        ? playbackPositionInfo?.status === 'COMPLETED'
          ? OverflowAction.MARK_AS_UNPLAYED
          : OverflowAction.MARK_AS_PLAYED
        : null,
      isOnArtistsTracksTab ? null : OverflowAction.VIEW_ARTIST_PAGE,
      isOwner ? OverflowAction.EDIT_TRACK : null,
      isOwner && track?.is_scheduled_release && track?.is_unlisted
        ? OverflowAction.RELEASE_NOW
        : null,
      isOwner ? OverflowAction.DELETE_TRACK : null
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: track_id,
        overflowActions
      })
    )
  }, [
    track_id,
    genre,
    isEditAlbumsEnabled,
    isOwner,
    isStreamGated,
    isNewPodcastControlsEnabled,
    playbackPositionInfo?.status,
    isOnArtistsTracksTab,
    track?.is_scheduled_release,
    track?.is_unlisted,
    dispatch
  ])

  const handlePressShare = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    dispatch(
      requestOpenShareModal({
        type: 'track',
        trackId: track_id,
        source: ShareSource.TILE
      })
    )
  }, [dispatch, track_id])

  const handlePressSave = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    if (has_current_user_saved) {
      dispatch(unsaveTrack(track_id, FavoriteSource.TILE))
    } else {
      dispatch(saveTrack(track_id, FavoriteSource.TILE))
    }
  }, [track_id, dispatch, has_current_user_saved])

  const handlePressRepost = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    if (has_current_user_reposted) {
      dispatch(undoRepostTrack(track_id, RepostSource.TILE))
    } else {
      dispatch(repostTrack(track_id, RepostSource.TILE))
    }
  }, [track_id, dispatch, has_current_user_reposted])

  const hideShare = !isOwner && field_visibility?.share === false
  const hidePlays = !isOwner && field_visibility?.play_count === false

  return (
    <LineupTile
      {...lineupTileProps}
      duration={duration}
      isPlayingUid={isPlayingUid}
      favoriteType={FavoriteType.TRACK}
      repostType={RepostType.TRACK}
      hasPreview={hasPreview}
      hideShare={hideShare}
      hidePlays={hidePlays}
      id={track_id}
      renderImage={renderImage}
      isUnlisted={is_unlisted}
      onPress={handlePress}
      onPressOverflow={handlePressOverflow}
      onPressRepost={handlePressRepost}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      onPressTitle={handlePressTitle}
      playCount={play_count}
      title={title}
      item={track}
      user={user}
      variant={variant}
    />
  )
}
