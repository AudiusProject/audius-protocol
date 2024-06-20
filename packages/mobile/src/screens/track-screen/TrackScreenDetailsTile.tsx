import { useCallback } from 'react'

import {
  useGatedContentAccess,
  useIsGatedContentPlaylistAddable
} from '@audius/common/hooks'
import {
  Name,
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  FavoriteType,
  SquareSizes
} from '@audius/common/models'
import type {
  UID,
  SearchUser,
  SearchTrack,
  Track,
  User
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  trackPageLineupActions,
  queueSelectors,
  reachabilitySelectors,
  tracksSocialActions,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  OverflowAction,
  OverflowSource,
  repostsUserListActions,
  favoritesUserListActions,
  RepostType,
  playerSelectors,
  playbackPositionSelectors,
  PurchaseableContentType
} from '@audius/common/store'
import { Genre, removeNullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'
import { trpc } from 'utils/trpcClientWeb'

import type { ImageProps } from '@audius/harmony-native'
import { DetailsTile } from 'app/components/details-tile'
import { TrackImage } from 'app/components/image/TrackImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { make, track as record } from 'app/services/analytics'

import { DownloadSection } from './DownloadSection'
const { getPlaying, getTrackId, getPreviewing } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const { tracksActions } = trackPageLineupActions
const { getUserId } = accountSelectors
const { getIsReachable } = reachabilitySelectors
const { getTrackPosition } = playbackPositionSelectors
const { makeGetCurrent } = queueSelectors
const getCurrentQueueItem = makeGetCurrent()

const messages = {
  track: 'track',
  podcast: 'podcast',
  remix: 'remix',
  hiddenTrack: 'hidden track',
  collectibleGated: 'collectible gated',
  specialAccess: 'special access',
  premiumTrack: 'premium track',
  generatedWithAi: 'generated with ai',
  trackDeleted: 'track [deleted by artist]'
}

type TrackScreenDetailsTileProps = {
  track: Track | SearchTrack
  user: User | SearchUser
  uid: UID
  isLineupLoading: boolean
}

const recordPlay = (id, play = true, isPreview = false) => {
  record(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.TRACK_PAGE,
      isPreview
    })
  )
}

export const TrackScreenDetailsTile = ({
  track,
  user,
  uid,
  isLineupLoading
}: TrackScreenDetailsTileProps) => {
  const { hasStreamAccess } = useGatedContentAccess(track as Track) // track is of type Track | SearchTrack but we only care about some of their common fields, maybe worth refactoring later
  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const navigation = useNavigation()

  const isReachable = useSelector(getIsReachable)
  const currentUserId = useSelector(getUserId)
  const dispatch = useDispatch()
  const playingId = useSelector(getTrackId)
  const isPlaying = useSelector(getPlaying)
  const isPreviewing = useSelector(getPreviewing)
  const isPlayingId = playingId === track.track_id

  const {
    _co_sign,
    description,
    genre,
    has_current_user_reposted,
    has_current_user_saved,
    is_unlisted: isUnlisted,
    is_stream_gated: isStreamGated,
    owner_id,
    play_count,
    remix_of,
    repost_count,
    save_count,
    title,
    track_id: trackId,
    stream_conditions: streamConditions,
    ddex_app: ddexApp,
    is_delete,
    duration,
    release_date: releaseDate,
    is_scheduled_release: isScheduledRelease
  } = track

  const isOwner = owner_id === currentUserId
  const hideFavorite = isUnlisted || !hasStreamAccess
  const hideRepost = isUnlisted || !isReachable || !hasStreamAccess

  const remixParentTrackId = remix_of?.tracks?.[0]?.parent_track_id
  const isRemix = !!remixParentTrackId
  const hasDownloadableAssets =
    (track as Track)?.is_downloadable ||
    ((track as Track)?._stems?.length ?? 0) > 0
  const isPlaylistAddable = useIsGatedContentPlaylistAddable(track as Track)

  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId },
    { enabled: !!trackId }
  )

  const renderImage = useCallback(
    (props: ImageProps) => (
      <TrackImage track={track} size={SquareSizes.SIZE_480_BY_480} {...props} />
    ),
    [track]
  )

  const currentQueueItem = useSelector(getCurrentQueueItem)
  const play = useCallback(
    ({ isPreview = false } = {}) => {
      if (isLineupLoading) return

      if (isPlaying && isPlayingId && isPreviewing === isPreview) {
        dispatch(tracksActions.pause())
        recordPlay(trackId, false, true)
      } else if (
        currentQueueItem.uid !== uid &&
        currentQueueItem.track &&
        currentQueueItem.track.track_id === trackId
      ) {
        dispatch(tracksActions.play())
        recordPlay(trackId)
      } else {
        dispatch(tracksActions.play(uid, { isPreview }))
        recordPlay(trackId, true, true)
      }
    },
    [
      trackId,
      currentQueueItem,
      uid,
      dispatch,
      isPlaying,
      isPlayingId,
      isPreviewing,
      isLineupLoading
    ]
  )

  const handlePressPlay = useCallback(() => play(), [play])
  const handlePressPreview = useCallback(
    () => play({ isPreview: true }),
    [play]
  )

  const handlePressFavorites = useCallback(() => {
    dispatch(setFavorite(trackId, FavoriteType.TRACK))
    navigation.push('Favorited', {
      id: trackId,
      favoriteType: FavoriteType.TRACK
    })
  }, [dispatch, trackId, navigation])

  const handlePressReposts = useCallback(() => {
    dispatch(setRepost(trackId, RepostType.TRACK))
    navigation.push('Reposts', { id: trackId, repostType: RepostType.TRACK })
  }, [dispatch, trackId, navigation])

  const handlePressSave = () => {
    if (!isOwner) {
      if (has_current_user_saved) {
        dispatch(unsaveTrack(trackId, FavoriteSource.TRACK_PAGE))
      } else {
        dispatch(saveTrack(trackId, FavoriteSource.TRACK_PAGE))
      }
    }
  }

  const handlePressRepost = () => {
    if (!isOwner) {
      if (has_current_user_reposted) {
        dispatch(undoRepostTrack(trackId, RepostSource.TRACK_PAGE))
      } else {
        dispatch(repostTrack(trackId, RepostSource.TRACK_PAGE))
      }
    }
  }

  const handlePressShare = () => {
    dispatch(
      requestOpenShareModal({
        type: 'track',
        trackId,
        source: ShareSource.PAGE
      })
    )
  }

  const handlePressEdit = useCallback(() => {
    navigation?.push('EditTrack', { id: trackId })
  }, [navigation, trackId])

  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId, userId: currentUserId })
  )
  const handlePressOverflow = () => {
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
    const addToAlbumAction =
      isOwner && !ddexApp ? OverflowAction.ADD_TO_ALBUM : null
    const addToPlaylistAction = isPlaylistAddable
      ? OverflowAction.ADD_TO_PLAYLIST
      : null
    const overflowActions = [
      addToAlbumAction,
      addToPlaylistAction,
      isOwner
        ? null
        : user.does_current_user_follow
        ? OverflowAction.UNFOLLOW_ARTIST
        : OverflowAction.FOLLOW_ARTIST,
      isNewPodcastControlsEnabled && isLongFormContent
        ? playbackPositionInfo?.status === 'COMPLETED'
          ? OverflowAction.MARK_AS_UNPLAYED
          : OverflowAction.MARK_AS_PLAYED
        : null,
      albumInfo ? OverflowAction.VIEW_ALBUM_PAGE : null,
      OverflowAction.VIEW_ARTIST_PAGE,
      isOwner && !ddexApp ? OverflowAction.EDIT_TRACK : null,
      isOwner && isScheduledRelease && isUnlisted
        ? OverflowAction.RELEASE_NOW
        : null,
      isOwner && !ddexApp ? OverflowAction.DELETE_TRACK : null
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: trackId,
        overflowActions
      })
    )
  }

  const renderBottomContent = () => {
    return hasDownloadableAssets ? <DownloadSection trackId={trackId} /> : null
  }

  return (
    <DetailsTile
      descriptionLinkPressSource='track page'
      coSign={_co_sign}
      description={description ?? undefined}
      hasReposted={has_current_user_reposted}
      hasSaved={has_current_user_saved}
      hasStreamAccess={hasStreamAccess}
      streamConditions={streamConditions}
      user={user}
      renderBottomContent={renderBottomContent}
      headerText={
        isRemix
          ? messages.remix
          : isStreamGated
          ? messages.premiumTrack
          : messages.track
      }
      hideFavorite={hideFavorite}
      hideRepost={hideRepost}
      hideShare={isUnlisted && !isOwner}
      hideOverflow={!isReachable || (isUnlisted && !isOwner)}
      hideFavoriteCount={isUnlisted || (!isOwner && (save_count ?? 0) <= 0)}
      hidePlayCount={
        (!isOwner && isUnlisted) ||
        isStreamGated ||
        (!isOwner && (play_count ?? 0) <= 0)
      }
      hideRepostCount={isUnlisted || (!isOwner && (repost_count ?? 0) <= 0)}
      isPlaying={isPlaying && isPlayingId}
      isPreviewing={isPreviewing}
      isUnlisted={isUnlisted}
      isDeleted={is_delete}
      onPressEdit={handlePressEdit}
      onPressFavorites={handlePressFavorites}
      onPressOverflow={handlePressOverflow}
      onPressPlay={handlePressPlay}
      onPressPreview={handlePressPreview}
      onPressRepost={handlePressRepost}
      onPressReposts={handlePressReposts}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      playCount={play_count}
      renderImage={renderImage}
      repostCount={repost_count}
      saveCount={save_count}
      title={title}
      track={track}
      contentId={trackId}
      contentType={PurchaseableContentType.TRACK}
      ddexApp={ddexApp}
      duration={duration}
      releaseDate={releaseDate}
    />
  )
}
