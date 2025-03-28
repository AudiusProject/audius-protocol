import { memo } from 'react'

import { useCurrentUserId, useTrack, useUser } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import { ShareSource, RepostSource, ID } from '@audius/common/models'
import {
  tracksSocialActions,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  themeSelectors,
  OverflowAction,
  OverflowSource,
  playerSelectors
} from '@audius/common/store'
import { Genre } from '@audius/common/utils'
import { Box, IconButton, IconKebabHorizontal } from '@audius/harmony'
import { useSelector, useDispatch } from 'react-redux'

import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import { TrackTileProps } from 'components/track/types'
import { AppState } from 'store/types'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getTrackWithFallback, getUserWithFallback } from '../helpers'

import TrackTile from './TrackTile'

const { getUid, getPlaying, getBuffering } = playerSelectors
const { getTheme } = themeSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open } = mobileOverflowMenuUIActions
const { repostTrack, undoRepostTrack } = tracksSocialActions

type ConnectedTrackTileProps = Omit<
  TrackTileProps,
  | 'title'
  | 'userId'
  | 'genre'
  | 'duration'
  | 'artistName'
  | 'artistHandle'
  | 'repostCount'
  | 'saveCount'
  | 'commentCount'
  | 'followeeReposts'
  | 'followeeSaves'
  | 'hasCurrentUserReposted'
  | 'hasCurrentUserSaved'
  | 'artistIsVerified'
  | 'isPlaying'
>

const ConnectedTrackTile = ({
  uid,
  id,
  index,
  size,
  ordered,
  trackTileStyles,
  togglePlay,
  isLoading,
  hasLoaded,
  isTrending,
  isActive,
  variant,
  containerClassName,
  isFeed = false,
  source
}: ConnectedTrackTileProps) => {
  const dispatch = useDispatch()

  const { data: track } = useTrack(id)
  const { data: partialUser } = useUser(track?.owner_id, {
    select: (user) => ({
      user_id: user?.user_id,
      handle: user?.handle,
      name: user?.name,
      is_verified: user?.is_verified,
      is_deactivated: user?.is_deactivated
    })
  })
  const { user_id, handle, name, is_verified, is_deactivated } =
    getUserWithFallback(partialUser) ?? {}
  const playingUid = useSelector(getUid)
  const isBuffering = useSelector(getBuffering)
  const isPlaying = useSelector(getPlaying)
  const { data: currentUserId } = useCurrentUserId()
  const darkMode = useSelector((state: AppState) =>
    shouldShowDark(getTheme(state))
  )

  const shareTrack = (trackId: ID) => {
    dispatch(
      requestOpenShareModal({
        type: 'track',
        trackId,
        source: ShareSource.TILE
      })
    )
  }

  const handleRepostTrack = (trackId: ID, isFeed: boolean) => {
    dispatch(repostTrack(trackId, RepostSource.TILE, isFeed))
  }

  const handleUnrepostTrack = (trackId: ID) => {
    dispatch(undoRepostTrack(trackId, RepostSource.TILE))
  }

  const clickOverflow = (trackId: ID, overflowActions: OverflowAction[]) => {
    dispatch(
      open({ source: OverflowSource.TRACKS, id: trackId, overflowActions })
    )
  }

  const trackWithFallback = getTrackWithFallback(track)
  const {
    is_delete,
    is_unlisted,
    is_stream_gated: isStreamGated,
    stream_conditions: streamConditions,
    track_id,
    title,
    genre,
    permalink,
    comment_count,
    repost_count,
    save_count,
    comments_disabled,
    field_visibility,
    followee_reposts,
    followee_saves,
    has_current_user_reposted,
    has_current_user_saved,
    activity_timestamp,
    _co_sign,
    is_scheduled_release: isScheduledRelease,
    release_date: releaseDate,
    duration,
    preview_cid,
    ddex_app: ddexApp,
    album_backlink
  } = trackWithFallback

  const isOwner = user_id === currentUserId

  const { isFetchingNFTAccess, hasStreamAccess } =
    useGatedContentAccess(trackWithFallback)
  const loading = isLoading || isFetchingNFTAccess

  const toggleRepost = (trackId: ID) => {
    if (has_current_user_reposted) {
      handleUnrepostTrack(trackId)
    } else {
      handleRepostTrack(trackId, isFeed)
    }
  }

  const onShare = (id: ID) => {
    shareTrack(id)
  }

  // We wanted to use mobile track tile on desktop, which means shimming in the desktop overflow
  // menu whenever isMobile is false.
  const renderOverflowMenu = () => {
    const menu: Omit<TrackMenuProps, 'children'> = {
      extraMenuItems: [],
      handle,
      includeAddToPlaylist: !is_unlisted || isOwner,
      includeAddToAlbum: isOwner && !ddexApp,
      includeArtistPick: isOwner,
      includeEdit: isOwner,
      ddexApp: track?.ddex_app,
      includeEmbed: !(is_unlisted || isStreamGated),
      includeFavorite: hasStreamAccess,
      includeRepost: hasStreamAccess,
      includeShare: true,
      includeTrackPage: true,
      isDeleted: is_delete || is_deactivated,
      isFavorited: has_current_user_saved,
      isOwner,
      isReposted: has_current_user_reposted,
      isUnlisted: is_unlisted,
      trackId: track_id,
      trackTitle: title,
      genre: genre as Genre,
      trackPermalink: permalink,
      type: 'track'
    }

    return (
      <Menu menu={menu}>
        {(ref, triggerPopup) => (
          <Box mb={-8}>
            <IconButton
              ref={ref}
              icon={IconKebabHorizontal}
              onClick={(e) => {
                e.stopPropagation()
                triggerPopup()
              }}
              aria-label='More'
              color='subdued'
            />
          </Box>
        )}
      </Menu>
    )
  }

  const onClickOverflow = (trackId: ID) => {
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS

    const repostAction =
      !isOwner && hasStreamAccess
        ? has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST
        : null
    const favoriteAction =
      !isOwner && hasStreamAccess
        ? has_current_user_saved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE
        : null
    const addToAlbumAction =
      isOwner && !ddexApp ? OverflowAction.ADD_TO_ALBUM : null
    const overflowActions = [
      repostAction,
      favoriteAction,
      addToAlbumAction,
      !is_unlisted || isOwner ? OverflowAction.ADD_TO_PLAYLIST : null,
      isLongFormContent
        ? OverflowAction.VIEW_EPISODE_PAGE
        : OverflowAction.VIEW_TRACK_PAGE,
      album_backlink ? OverflowAction.VIEW_ALBUM_PAGE : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    clickOverflow(trackId, overflowActions)
  }

  if (is_delete || is_deactivated) return null

  return (
    <TrackTile
      containerClassName={containerClassName}
      uid={uid}
      id={track_id}
      userId={user_id}
      index={index}
      key={`${index}`}
      showSkeleton={isLoading}
      hasLoaded={hasLoaded}
      ordered={ordered}
      title={title}
      genre={genre as Genre}
      repostCount={repost_count}
      saveCount={save_count}
      commentCount={comment_count}
      commentsDisabled={comments_disabled}
      followeeReposts={followee_reposts}
      followeeSaves={followee_saves}
      hasCurrentUserReposted={has_current_user_reposted}
      hasCurrentUserSaved={has_current_user_saved}
      duration={duration}
      activityTimestamp={activity_timestamp}
      trackTileStyles={trackTileStyles}
      size={size}
      fieldVisibility={field_visibility}
      coSign={_co_sign}
      // Artist
      artistHandle={handle}
      artistName={name}
      artistIsVerified={is_verified}
      // Playback
      permalink={permalink}
      togglePlay={togglePlay}
      hasPreview={!!preview_cid}
      isActive={uid === playingUid || isActive}
      isLoading={loading}
      isPlaying={uid === playingUid && isPlaying}
      isBuffering={isBuffering}
      onShare={onShare}
      onClickOverflow={onClickOverflow}
      renderOverflow={renderOverflowMenu}
      toggleRepost={toggleRepost}
      isOwner={isOwner}
      darkMode={darkMode}
      isMatrix={isMatrix()}
      isTrending={isTrending}
      isUnlisted={is_unlisted}
      isStreamGated={isStreamGated}
      streamConditions={streamConditions}
      hasStreamAccess={hasStreamAccess}
      variant={variant}
      isScheduledRelease={isScheduledRelease}
      releaseDate={releaseDate}
      source={source}
    />
  )
}

export default memo(ConnectedTrackTile)
