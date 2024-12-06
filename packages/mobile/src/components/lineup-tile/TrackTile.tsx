import { useCallback } from 'react'

import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  SquareSizes,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import type { Track, User } from '@audius/common/models'
import { trpc } from '@audius/common/services'
import {
  accountSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors,
  tracksSocialActions,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  OverflowAction,
  OverflowSource,
  playerSelectors,
  playbackPositionSelectors,
  trackPageActions,
  usePublishConfirmationModal
} from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import { Genre, removeNullable } from '@audius/common/utils'
import { useNavigationState } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import type { ImageProps } from '@audius/harmony-native'
import type { LineupItemProps } from 'app/components/lineup-tile/types'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useNavigation } from 'app/hooks/useNavigation'

import type { TileProps } from '../core'
import { TrackImage } from '../image/TrackImage'

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
  onPress,
  togglePlay,
  track,
  user,
  variant,
  ...lineupTileProps
}: TrackTileProps) => {
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
  const { onOpen: openPublishModal } = usePublishConfirmationModal()

  const isOwner = currentUserId === track.owner_id

  const {
    duration,
    field_visibility,
    is_unlisted,
    has_current_user_reposted,
    has_current_user_saved,
    title,
    track_id,
    genre,
    stream_conditions: streamConditions,
    preview_cid,
    ddex_app: ddexApp,
    is_unlisted: isUnlisted,
    _co_sign: coSign
  } = track

  const { artist_pick_track_id } = user
  const isArtistPick = isOwner && artist_pick_track_id === track_id

  const hasPreview =
    isUSDCEnabled &&
    isContentUSDCPurchaseGated(streamConditions) &&
    !!preview_cid

  const renderImage = useCallback(
    (props: ImageProps) => (
      <TrackImage
        trackId={track.track_id}
        size={SquareSizes.SIZE_150_BY_150}
        {...props}
      />
    ),
    [track]
  )

  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId: track_id },
    { enabled: !!track_id }
  )

  const handlePress = useCallback(() => {
    setTimeout(() => {
      togglePlay({
        uid: lineupTileProps.uid,
        id: track_id,
        source: PlaybackSource.TRACK_TILE
      })
      onPress?.(track_id)
    }, 100)
  }, [togglePlay, lineupTileProps.uid, track_id, onPress])

  const handlePressTitle = useCallback(() => {
    navigation.push('Track', { id: track_id })
    onPress?.(track_id)
  }, [navigation, onPress, track_id])

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
      isOwner && !ddexApp ? OverflowAction.ADD_TO_ALBUM : null,
      !isUnlisted || isOwner ? OverflowAction.ADD_TO_PLAYLIST : null,
      isLongFormContent
        ? OverflowAction.VIEW_EPISODE_PAGE
        : OverflowAction.VIEW_TRACK_PAGE,
      albumInfo ? OverflowAction.VIEW_ALBUM_PAGE : null,
      isLongFormContent
        ? playbackPositionInfo?.status === 'COMPLETED'
          ? OverflowAction.MARK_AS_UNPLAYED
          : OverflowAction.MARK_AS_PLAYED
        : null,
      isOwner && !isArtistPick ? OverflowAction.SET_ARTIST_PICK : null,
      isArtistPick ? OverflowAction.UNSET_ARTIST_PICK : null,
      isOnArtistsTracksTab ? null : OverflowAction.VIEW_ARTIST_PAGE,
      isOwner && !ddexApp ? OverflowAction.EDIT_TRACK : null,
      isOwner && track?.is_scheduled_release && track?.is_unlisted
        ? OverflowAction.RELEASE_NOW
        : null,
      isOwner && !ddexApp ? OverflowAction.DELETE_TRACK : null
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
    isOwner,
    ddexApp,
    isUnlisted,
    albumInfo,
    playbackPositionInfo?.status,
    isArtistPick,
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

  const publish = useCallback(() => {
    dispatch(trackPageActions.makeTrackPublic(track_id))
  }, [dispatch, track_id])

  const handlePressPublish = useCallback(() => {
    openPublishModal({ contentType: 'track', confirmCallback: publish })
  }, [openPublishModal, publish])

  const onPressEdit = useCallback(() => {
    navigation?.push('EditTrack', { id: track_id })
  }, [navigation, track_id])

  const hideShare = !isOwner && field_visibility?.share === false

  return (
    <LineupTile
      {...lineupTileProps}
      coSign={coSign}
      duration={duration}
      isPlayingUid={isPlayingUid}
      hasPreview={hasPreview}
      hideShare={hideShare}
      id={track_id}
      uid={lineupTileProps.uid}
      renderImage={renderImage}
      isUnlisted={is_unlisted}
      onPress={handlePress}
      onPressOverflow={handlePressOverflow}
      onPressRepost={handlePressRepost}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      onPressTitle={handlePressTitle}
      onPressPublish={handlePressPublish}
      onPressEdit={onPressEdit}
      title={title}
      item={track}
      user={user}
      variant={variant}
    />
  )
}
