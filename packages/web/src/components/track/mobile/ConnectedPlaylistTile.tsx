import { memo, useCallback, useMemo, MouseEvent } from 'react'

import {
  Name,
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  FavoriteType,
  ID,
  Track
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheUsersSelectors,
  collectionsSocialActions,
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
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { useRecord, make } from 'common/store/analytics/actions'
import { PlaylistTileProps } from 'components/track/types'
import { useFlag } from 'hooks/useRemoteConfig'
import { AppState } from 'store/types'
import {
  collectionPage,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE
} from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import PlaylistTile from './PlaylistTile'
const { getUid, getBuffering, getPlaying } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { getTheme } = themeSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open } = mobileOverflowMenuUIActions
const { getUserFromCollection } = cacheUsersSelectors
const {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} = collectionsSocialActions
const { getCollection, getTracksFromCollection } = cacheCollectionsSelectors
const getUserId = accountSelectors.getUserId

type OwnProps = Omit<
  PlaylistTileProps,
  | 'id'
  | 'userId'
  | 'duration'
  | 'artistName'
  | 'genre'
  | 'artistHandle'
  | 'isPublic'
  | 'repostCount'
  | 'saveCount'
  | 'trackCount'
  | 'ownerId'
  | 'coverArtSizes'
  | 'isActive'
  | 'isPlaying'
  | 'contentTitle'
  | 'activeTrackUid'
  | 'followeeReposts'
  | 'followeeSaves'
  | 'hasCurrentUserReposted'
  | 'hasCurrentUserSaved'
  | 'isAlbum'
  | 'playlistTitle'
  | 'artistIsVerified'
  | 'goToRoute'
>

type ConnectedPlaylistTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedPlaylistTile = ({
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
  isTrending,
  variant,
  containerClassName,
  isFeed = false
}: ConnectedPlaylistTileProps) => {
  const collection = getCollectionWithFallback(nullableCollection)
  const user = getUserWithFallback(nullableUser)
  const record = useRecord()
  const isActive = useMemo(() => {
    return tracks.some((track) => track.uid === playingUid)
  }, [tracks, playingUid])

  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)

  const isOwner = collection.playlist_owner_id === currentUserId

  const toggleSave = useCallback(() => {
    if (collection.has_current_user_saved) {
      unsaveCollection(collection.playlist_id)
    } else {
      saveCollection(collection.playlist_id, isFeed)
    }
  }, [collection, unsaveCollection, saveCollection, isFeed])

  const toggleRepost = useCallback(() => {
    if (collection.has_current_user_reposted) {
      unrepostCollection(collection.playlist_id)
    } else {
      repostCollection(collection.playlist_id, isFeed)
    }
  }, [collection, unrepostCollection, repostCollection, isFeed])

  const getRoute = useCallback(() => {
    return collectionPage(
      user.handle,
      collection.playlist_name,
      collection.playlist_id,
      collection.permalink,
      collection.is_album
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
      isOwner && (!collection.is_album || isEditAlbumsEnabled)
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && (!collection.is_album || isEditAlbumsEnabled)
        ? collection.is_album
          ? OverflowAction.DELETE_ALBUM
          : OverflowAction.DELETE_PLAYLIST
        : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean)

    clickOverflow(
      collection.playlist_id,
      // @ts-ignore
      overflowActions
    )
  }, [collection, isOwner, clickOverflow, isEditAlbumsEnabled])

  const togglePlay = useCallback(() => {
    if (uploading) return

    const source = variant
      ? PlaybackSource.CHAT_PLAYLIST_TRACK
      : PlaybackSource.PLAYLIST_TILE_TRACK

    if (!isPlaying || !isActive) {
      if (isActive) {
        playTrack(playingUid!)
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${playingTrackId}`,
            source
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
            source
          })
        )
      }
    } else {
      pauseTrack()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${playingTrackId}`,
          source
        })
      )
    }
  }, [
    variant,
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
      containerClassName={containerClassName}
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
      permalink={collection.permalink}
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
      variant={variant}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    collection:
      ownProps.collection ?? getCollection(state, { uid: ownProps.uid }),
    tracks:
      ownProps.tracks ?? getTracksFromCollection(state, { uid: ownProps.uid }),
    user: getUserFromCollection(state, { uid: ownProps.uid }),
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
    saveCollection: (collectionId: ID, isFeed: boolean) =>
      dispatch(saveCollection(collectionId, FavoriteSource.TILE, isFeed)),
    unsaveCollection: (collectionId: ID) =>
      dispatch(unsaveCollection(collectionId, FavoriteSource.TILE)),
    repostCollection: (collectionId: ID, isFeed: boolean) =>
      dispatch(repostCollection(collectionId, RepostSource.TILE, isFeed)),
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
)(memo(ConnectedPlaylistTile))
