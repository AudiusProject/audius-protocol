import { memo, useCallback, useMemo, MouseEvent } from 'react'

import {
  ID,
  FavoriteSource,
  RepostSource,
  Name,
  PlaybackSource,
  ShareSource,
  FavoriteType,
  Track
} from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
import { useRecord, make } from 'common/store/analytics/actions'
import {
  getCollection,
  getTracksFromCollection
} from 'common/store/cache/collections/selectors'
import { getUserFromCollection } from 'common/store/cache/users/selectors'
import {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} from 'common/store/social/collections/actions'
import { open } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { getTheme } from 'common/store/ui/theme/selectors'
import { setFavorite } from 'common/store/user-list/favorites/actions'
import { setRepost } from 'common/store/user-list/reposts/actions'
import { RepostType } from 'common/store/user-list/reposts/types'
import { PlaylistTileProps } from 'components/track/types'
import { getUid, getBuffering, getPlaying } from 'store/player/selectors'
import { AppState } from 'store/types'
import {
  albumPage,
  playlistPage,
  profilePage,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE
} from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import PlaylistTile from './PlaylistTile'

type ConnectedPlaylistTileProps = PlaylistTileProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedPlaylistTile = memo(
  ({
    uid,
    index,
    size,
    collection: nullableCollection,
    user: nullableUser,
    tracks,
    playTrack,
    pauseTrack,
    playingUid,
    isBuffering,
    isPlaying,
    goToRoute,
    isLoading,
    numLoadingSkeletonRows,
    hasLoaded,
    playingTrackId,
    uploading,
    unsaveCollection,
    saveCollection,
    shareCollection,
    unrepostCollection,
    repostCollection,
    setRepostPlaylistId,
    setFavoritePlaylistId,
    clickOverflow,
    currentUserId,
    darkMode,
    showRankIcon,
    isTrending
  }: ConnectedPlaylistTileProps) => {
    const collection = getCollectionWithFallback(nullableCollection)
    const user = getUserWithFallback(nullableUser)
    const record = useRecord()
    const isActive = useMemo(() => {
      return tracks.some((track) => track.uid === playingUid)
    }, [tracks, playingUid])

    const isOwner = collection.playlist_owner_id === currentUserId

    const toggleSave = useCallback(() => {
      if (collection.has_current_user_saved) {
        unsaveCollection(collection.playlist_id)
      } else {
        saveCollection(collection.playlist_id)
      }
    }, [collection, unsaveCollection, saveCollection])

    const toggleRepost = useCallback(() => {
      if (collection.has_current_user_reposted) {
        unrepostCollection(collection.playlist_id)
      } else {
        repostCollection(collection.playlist_id)
      }
    }, [collection, unrepostCollection, repostCollection])

    const getRoute = useCallback(() => {
      return collection.is_album
        ? albumPage(
            user.handle,
            collection.playlist_name,
            collection.playlist_id
          )
        : playlistPage(
            user.handle,
            collection.playlist_name,
            collection.playlist_id
          )
    }, [collection, user])

    const goToCollectionPage = useCallback(
      (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        const route = getRoute()
        goToRoute(route)
      },
      [goToRoute, getRoute]
    )

    const goToArtistPage = useCallback(
      (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        goToRoute(profilePage(user.handle))
      },
      [goToRoute, user]
    )

    const onShare = useCallback(() => {
      shareCollection(collection.playlist_id)
    }, [shareCollection, collection.playlist_id])

    const onClickOverflow = useCallback(() => {
      const overflowActions = [
        collection.has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST,
        collection.has_current_user_saved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE,
        collection.is_album
          ? OverflowAction.VIEW_ALBUM_PAGE
          : OverflowAction.VIEW_PLAYLIST_PAGE,
        isOwner && !collection.is_album
          ? OverflowAction.PUBLISH_PLAYLIST
          : null,
        isOwner && !collection.is_album ? OverflowAction.DELETE_PLAYLIST : null,
        OverflowAction.VIEW_ARTIST_PAGE
      ].filter(Boolean)

      clickOverflow(
        collection.playlist_id,
        // @ts-ignore
        overflowActions
      )
    }, [collection, isOwner, clickOverflow])

    const togglePlay = useCallback(() => {
      if (uploading) return
      if (!isPlaying || !isActive) {
        if (isActive) {
          playTrack(playingUid!)
          record(
            make(Name.PLAYBACK_PLAY, {
              id: `${playingTrackId}`,
              source: PlaybackSource.PLAYLIST_TILE_TRACK
            })
          )
        } else {
          const trackUid = tracks[0] ? tracks[0].uid : null
          const trackId = tracks[0] ? tracks[0].track_id : null
          if (!trackUid || !trackId) return
          playTrack(trackUid)
          record(
            make(Name.PLAYBACK_PLAY, {
              id: `${trackId}`,
              source: PlaybackSource.PLAYLIST_TILE_TRACK
            })
          )
        }
      } else {
        pauseTrack()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${playingTrackId}`,
            source: PlaybackSource.PLAYLIST_TILE_TRACK
          })
        )
      }
    }, [
      isPlaying,
      tracks,
      playTrack,
      pauseTrack,
      isActive,
      playingUid,
      playingTrackId,
      uploading,
      record
    ])

    const makeGoToRepostsPage =
      (collectionId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setRepostPlaylistId(collectionId)
        goToRoute(REPOSTING_USERS_ROUTE)
      }

    const makeGoToFavoritesPage =
      (collectionId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setFavoritePlaylistId(collectionId)
        goToRoute(FAVORITING_USERS_ROUTE)
      }

    return (
      <PlaylistTile
        uid={uid}
        id={collection.playlist_id}
        userId={collection.playlist_owner_id}
        index={index}
        key={`${index}-${collection.playlist_name}`}
        showSkeleton={isLoading}
        hasLoaded={hasLoaded}
        // UI
        isAlbum={collection.is_album}
        isPublic={!collection.is_private}
        contentTitle={collection.is_album ? 'album' : 'playlist'}
        playlistTitle={collection.playlist_name}
        artistHandle={user.handle}
        artistName={user.name}
        artistIsVerified={user.is_verified}
        ownerId={collection.playlist_owner_id}
        coverArtSizes={collection._cover_art_sizes}
        duration={tracks.reduce(
          (duration: number, track: Track) => duration + track.duration,
          0
        )}
        tracks={tracks}
        trackCount={collection.track_count}
        size={size}
        repostCount={collection.repost_count}
        saveCount={collection.save_count}
        followeeReposts={collection.followee_reposts}
        followeeSaves={collection.followee_saves}
        hasCurrentUserReposted={collection.has_current_user_reposted}
        hasCurrentUserSaved={collection.has_current_user_saved}
        activityTimestamp={collection.activity_timestamp}
        numLoadingSkeletonRows={numLoadingSkeletonRows}
        // Playback
        togglePlay={togglePlay}
        playTrack={playTrack}
        pauseTrack={pauseTrack}
        isActive={isActive}
        isPlaying={isActive && isPlaying}
        isLoading={isActive && isBuffering}
        activeTrackUid={playingUid || null}
        goToRoute={goToRoute}
        goToArtistPage={goToArtistPage}
        goToCollectionPage={goToCollectionPage}
        toggleSave={toggleSave}
        toggleRepost={toggleRepost}
        onShare={onShare}
        onClickOverflow={onClickOverflow}
        makeGoToRepostsPage={makeGoToRepostsPage}
        makeGoToFavoritesPage={makeGoToFavoritesPage}
        isOwner={isOwner}
        darkMode={darkMode}
        isMatrix={isMatrix()}
        isTrending={isTrending}
        showRankIcon={showRankIcon}
      />
    )
  }
)

function mapStateToProps(state: AppState, ownProps: PlaylistTileProps) {
  return {
    collection: getCollection(state, { uid: ownProps.uid }),
    user: getUserFromCollection(state, { uid: ownProps.uid }),
    tracks: getTracksFromCollection(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),

    currentUserId: getUserId(state),
    darkMode: shouldShowDark(getTheme(state))
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareCollection: (collectionId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId,
          source: ShareSource.TILE
        })
      ),
    saveCollection: (collectionId: ID) =>
      dispatch(saveCollection(collectionId, FavoriteSource.TILE)),
    unsaveCollection: (collectionId: ID) =>
      dispatch(unsaveCollection(collectionId, FavoriteSource.TILE)),
    repostCollection: (collectionId: ID) =>
      dispatch(repostCollection(collectionId, RepostSource.TILE)),
    unrepostCollection: (collectionId: ID) =>
      dispatch(undoRepostCollection(collectionId, RepostSource.TILE)),
    clickOverflow: (collectionId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({
          source: OverflowSource.COLLECTIONS,
          id: collectionId,
          overflowActions
        })
      ),
    setRepostPlaylistId: (collectionId: ID) =>
      dispatch(setRepost(collectionId, RepostType.COLLECTION)),
    setFavoritePlaylistId: (collectionId: ID) =>
      dispatch(setFavorite(collectionId, FavoriteType.PLAYLIST))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedPlaylistTile)
