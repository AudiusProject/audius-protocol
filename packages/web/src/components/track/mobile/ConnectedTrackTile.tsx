import { memo, MouseEvent } from 'react'

import { useGatedContentAccess } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  FavoriteType,
  ID
} from '@audius/common/models'
import { FeatureFlags, trpc } from '@audius/common/services'
import {
  accountSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors,
  tracksSocialActions,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  themeSelectors,
  OverflowAction,
  OverflowSource,
  repostsUserListActions,
  favoritesUserListActions,
  RepostType,
  playerSelectors
} from '@audius/common/store'
import { Genre, route } from '@audius/common/utils'
import { Box, IconButton, IconKebabHorizontal } from '@audius/harmony'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import { TrackTileProps } from 'components/track/types'
import { useFlag } from 'hooks/useRemoteConfig'
import { AppState } from 'store/types'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getTrackWithFallback, getUserWithFallback } from '../helpers'

import TrackTile from './TrackTile'
const { REPOSTING_USERS_ROUTE, FAVORITING_USERS_ROUTE } = route
const { getUid, getPlaying, getBuffering } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { getTheme } = themeSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open } = mobileOverflowMenuUIActions
const { getTrack } = cacheTracksSelectors
const { getUserFromTrack } = cacheUsersSelectors
const { saveTrack, unsaveTrack, repostTrack, undoRepostTrack } =
  tracksSocialActions
const getUserId = accountSelectors.getUserId

type OwnProps = Omit<
  TrackTileProps,
  | 'id'
  | 'title'
  | 'userId'
  | 'genre'
  | 'duration'
  | 'artistName'
  | 'artistHandle'
  | 'repostCount'
  | 'saveCount'
  | 'commentCount'
  | 'coverArtSizes'
  | 'followeeReposts'
  | 'followeeSaves'
  | 'hasCurrentUserReposted'
  | 'hasCurrentUserSaved'
  | 'artistIsVerified'
  | 'isPlaying'
  | 'goToRoute'
>

type ConnectedTrackTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedTrackTile = ({
  uid,
  index,
  size,
  track,
  user,
  ordered,
  trackTileStyles,
  showArtistPick,
  goToRoute,
  togglePlay,
  isBuffering,
  isPlaying,
  playingUid,
  isLoading,
  hasLoaded,
  currentUserId,
  saveTrack,
  unsaveTrack,
  repostTrack,
  unrepostTrack,
  shareTrack,
  setRepostTrackId,
  setFavoriteTrackId,
  clickOverflow,
  darkMode,
  isTrending,
  showRankIcon,
  isActive,
  variant,
  containerClassName,
  isFeed = false,
  source
}: ConnectedTrackTileProps) => {
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
    repost_count,
    save_count,
    comment_count,
    comments_disabled,
    field_visibility,
    followee_reposts,
    followee_saves,
    has_current_user_reposted,
    has_current_user_saved,
    _cover_art_sizes,
    activity_timestamp,
    play_count,
    _co_sign,
    is_scheduled_release: isScheduledRelease,
    release_date: releaseDate,
    duration,
    preview_cid,
    ddex_app: ddexApp
  } = trackWithFallback

  const { artist_pick_track_id, user_id, handle, name, is_verified } =
    getUserWithFallback(user)

  const isOwner = user_id === currentUserId
  const isArtistPick = showArtistPick && artist_pick_track_id === track_id

  const { isEnabled: isNewPodcastControlsEnabled } = useFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId: track_id },
    { enabled: !!track_id }
  )
  const { isFetchingNFTAccess, hasStreamAccess } =
    useGatedContentAccess(trackWithFallback)
  const loading = isLoading || isFetchingNFTAccess

  const toggleSave = (trackId: ID) => {
    if (has_current_user_saved) {
      unsaveTrack(trackId)
    } else {
      saveTrack(trackId, isFeed)
    }
  }

  const toggleRepost = (trackId: ID) => {
    if (has_current_user_reposted) {
      unrepostTrack(trackId)
    } else {
      repostTrack(trackId, isFeed)
    }
  }

  const onShare = (id: ID) => {
    shareTrack(id)
  }

  const makeGoToRepostsPage = (trackId: ID) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setRepostTrackId(trackId)
    goToRoute(REPOSTING_USERS_ROUTE)
  }

  const makeGoToFavoritesPage =
    (trackId: ID) => (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      setFavoriteTrackId(trackId)
      goToRoute(FAVORITING_USERS_ROUTE)
    }

  const makeGoToCommentsPage = (_: ID) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    goToRoute(track?.permalink + '?showComments=true')
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
      isArtistPick,
      isDeleted: is_delete || user?.is_deactivated,
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
      isNewPodcastControlsEnabled && isLongFormContent
        ? OverflowAction.VIEW_EPISODE_PAGE
        : OverflowAction.VIEW_TRACK_PAGE,
      albumInfo ? OverflowAction.VIEW_ALBUM_PAGE : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    clickOverflow(trackId, overflowActions)
  }

  if (is_delete || user?.is_deactivated) return null

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
      coverArtSizes={_cover_art_sizes}
      activityTimestamp={activity_timestamp}
      trackTileStyles={trackTileStyles}
      size={size}
      listenCount={play_count}
      fieldVisibility={field_visibility}
      coSign={_co_sign}
      // Artist Pick
      isArtistPick={isArtistPick}
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
      toggleSave={toggleSave}
      onShare={onShare}
      onClickOverflow={onClickOverflow}
      renderOverflow={renderOverflowMenu}
      toggleRepost={toggleRepost}
      makeGoToRepostsPage={makeGoToRepostsPage}
      makeGoToFavoritesPage={makeGoToFavoritesPage}
      makeGoToCommentsPage={makeGoToCommentsPage}
      goToRoute={goToRoute}
      isOwner={isOwner}
      darkMode={darkMode}
      isMatrix={isMatrix()}
      isTrending={isTrending}
      isUnlisted={is_unlisted}
      isStreamGated={isStreamGated}
      streamConditions={streamConditions}
      hasStreamAccess={hasStreamAccess}
      showRankIcon={showRankIcon}
      variant={variant}
      isScheduledRelease={isScheduledRelease}
      releaseDate={releaseDate}
      source={source}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    track: getTrack(state, { uid: ownProps.uid }),
    user: getUserFromTrack(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),

    currentUserId: getUserId(state),
    darkMode: shouldShowDark(getTheme(state))
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    shareTrack: (trackId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'track',
          trackId,
          source: ShareSource.TILE
        })
      ),
    saveTrack: (trackId: ID, isFeed: boolean) =>
      dispatch(saveTrack(trackId, FavoriteSource.TILE, isFeed)),
    unsaveTrack: (trackId: ID) =>
      dispatch(unsaveTrack(trackId, FavoriteSource.TILE)),
    repostTrack: (trackId: ID, isFeed: boolean) =>
      dispatch(repostTrack(trackId, RepostSource.TILE, isFeed)),
    unrepostTrack: (trackId: ID) =>
      dispatch(undoRepostTrack(trackId, RepostSource.TILE)),
    clickOverflow: (trackId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.TRACKS, id: trackId, overflowActions })
      ),
    setRepostTrackId: (trackId: ID) =>
      dispatch(setRepost(trackId, RepostType.TRACK)),
    setFavoriteTrackId: (trackId: ID) =>
      dispatch(setFavorite(trackId, FavoriteType.TRACK)),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedTrackTile))
