import React, { memo } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'

import TrackTile from './TrackTile'
import { TrackTileProps } from 'components/track/types'
import { ID } from 'models/common/Identifiers'
import { getTrack } from 'store/cache/tracks/selectors'
import { getUserFromTrack } from 'store/cache/users/selectors'
import { getUid, getPlaying, getBuffering } from 'store/player/selectors'
import {
  saveTrack,
  unsaveTrack,
  repostTrack,
  undoRepostTrack,
  shareTrack
} from 'store/social/tracks/actions'
import {
  trackPage,
  profilePage,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE
} from 'utils/route'
import {
  OverflowAction,
  OverflowSource
} from 'store/application/ui/mobileOverflowModal/types'
import { open } from 'store/application/ui/mobileOverflowModal/actions'
import { AppState } from 'store/types'
import { RepostType } from 'containers/reposts-page/store/types'
import { getUserId } from 'store/account/selectors'
import { setFavorite } from 'containers/favorites-page/store/actions'
import { FavoriteType } from 'models/Favorite'
import { setRepost } from 'containers/reposts-page/store/actions'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'
import { getTheme } from 'store/application/ui/theme/selectors'
import { FavoriteSource, RepostSource, ShareSource } from 'services/analytics'
import { getTrackWithFallback, getUserWithFallback } from '../helpers'

type ConnectedTrackTileProps = TrackTileProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedTrackTile = memo(
  ({
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
    darkMode
  }: ConnectedTrackTileProps) => {
    const {
      is_delete,
      track_id,
      title,
      repost_count,
      save_count,
      followee_reposts,
      followee_saves,
      has_current_user_reposted,
      has_current_user_saved,
      _cover_art_sizes,
      activity_timestamp,
      play_count,
      _co_sign,
      duration
    } = getTrackWithFallback(track)

    const {
      _artist_pick,
      user_id,
      handle,
      name,
      is_verified
    } = getUserWithFallback(user)

    const isOwner = user_id === currentUserId

    const toggleSave = (trackId: ID) => {
      if (has_current_user_saved) {
        unsaveTrack(trackId)
      } else {
        saveTrack(trackId)
      }
    }

    const toggleRepost = (trackId: ID) => {
      if (has_current_user_reposted) {
        unrepostTrack(trackId)
      } else {
        repostTrack(trackId)
      }
    }

    const goToTrackPage = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      goToRoute(trackPage(handle, title, track_id))
    }

    const goToArtistPage = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      goToRoute(profilePage(handle))
    }

    const onShare = (id: ID) => {
      shareTrack(id)
    }

    const makeGoToRepostsPage = (trackId: ID) => (
      e: React.MouseEvent<HTMLElement>
    ) => {
      e.stopPropagation()
      setRepostTrackId(trackId)
      goToRoute(REPOSTING_USERS_ROUTE)
    }

    const makeGoToFavoritesPage = (trackId: ID) => (
      e: React.MouseEvent<HTMLElement>
    ) => {
      e.stopPropagation()
      setFavoriteTrackId(trackId)
      goToRoute(FAVORITING_USERS_ROUTE)
    }

    const onClickOverflow = (trackId: ID) => {
      const overflowActions = [
        !isOwner
          ? has_current_user_reposted
            ? OverflowAction.UNREPOST
            : OverflowAction.REPOST
          : null,
        !isOwner
          ? has_current_user_saved
            ? OverflowAction.UNFAVORITE
            : OverflowAction.FAVORITE
          : null,
        OverflowAction.SHARE,
        OverflowAction.ADD_TO_PLAYLIST,
        OverflowAction.VIEW_TRACK_PAGE,
        OverflowAction.VIEW_ARTIST_PAGE
      ].filter(Boolean) as OverflowAction[]

      clickOverflow(trackId, overflowActions)
    }

    if (is_delete) return null

    return (
      <TrackTile
        uid={uid}
        id={track_id}
        userId={user_id}
        index={index}
        key={`${index}`}
        showSkeleton={isLoading}
        hasLoaded={hasLoaded}
        ordered={ordered}
        title={title}
        repostCount={repost_count}
        saveCount={save_count}
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
        coSign={_co_sign}
        // Artist Pick
        showArtistPick={showArtistPick}
        isArtistPick={_artist_pick === track_id}
        // Artist
        artistHandle={handle}
        artistName={name}
        artistIsVerified={is_verified}
        // Playback
        togglePlay={togglePlay}
        isActive={uid === playingUid}
        isLoading={isBuffering}
        isPlaying={uid === playingUid && isPlaying}
        goToArtistPage={goToArtistPage}
        goToTrackPage={goToTrackPage}
        toggleSave={toggleSave}
        onShare={onShare}
        onClickOverflow={onClickOverflow}
        toggleRepost={toggleRepost}
        makeGoToRepostsPage={makeGoToRepostsPage}
        makeGoToFavoritesPage={makeGoToFavoritesPage}
        goToRoute={goToRoute}
        isOwner={isOwner}
        darkMode={darkMode}
        isMatrix={isMatrix()}
      />
    )
  }
)

function mapStateToProps(state: AppState, ownProps: TrackTileProps) {
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
      dispatch(shareTrack(trackId, ShareSource.TILE)),
    saveTrack: (trackId: ID) =>
      dispatch(saveTrack(trackId, FavoriteSource.TILE)),
    unsaveTrack: (trackId: ID) =>
      dispatch(unsaveTrack(trackId, FavoriteSource.TILE)),
    repostTrack: (trackId: ID) =>
      dispatch(repostTrack(trackId, RepostSource.TILE)),
    unrepostTrack: (trackId: ID) =>
      dispatch(undoRepostTrack(trackId, RepostSource.TILE)),
    clickOverflow: (trackId: ID, overflowActions: OverflowAction[]) =>
      dispatch(open(OverflowSource.TRACKS, trackId, overflowActions)),
    setRepostTrackId: (trackId: ID) =>
      dispatch(setRepost(trackId, RepostType.TRACK)),
    setFavoriteTrackId: (trackId: ID) =>
      dispatch(setFavorite(trackId, FavoriteType.TRACK)),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedTrackTile)
