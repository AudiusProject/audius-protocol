import { memo, useCallback, useMemo, MouseEvent } from 'react'

import {
  useCollection,
  useCurrentUserId,
  useTracks,
  useUser
} from '@audius/common/api'
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
import { route } from '@audius/common/utils'
import { useSelector, useDispatch } from 'react-redux'

import { useRecord, make } from 'common/store/analytics/actions'
import { PlaylistTileProps } from 'components/track/types'
import { AppState } from 'store/types'
import { push } from 'utils/navigation'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import PlaylistTile from './PlaylistTile'
const { REPOSTING_USERS_ROUTE, FAVORITING_USERS_ROUTE, collectionPage } = route
const { getUid, getBuffering, getPlaying } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { getTheme } = themeSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open } = mobileOverflowMenuUIActions
const {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} = collectionsSocialActions
const { getTracksFromCollection } = cacheCollectionsSelectors
const getUserId = accountSelectors.getUserId

type OwnProps = Omit<
  PlaylistTileProps,
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
> & {
  collection?: any
  user?: any
  tracks?: Track[]
}

const ConnectedPlaylistTile = ({
  uid,
  id,
  index,
  size,
  collection: collectionProp,
  user: userProp,
  tracks: tracksProp,
  playTrack,
  pauseTrack,
  isLoading,
  numLoadingSkeletonRows,
  hasLoaded,
  playingTrackId,
  uploading,
  isTrending,
  variant,
  containerClassName,
  isFeed = false,
  source
}: OwnProps) => {
  const dispatch = useDispatch()

  // Move mapStateToProps selectors into component
  const { data: collectionWithoutFallback } = useCollection(id)
  const collection = getCollectionWithFallback(collectionWithoutFallback)
  const { data: tracks } = useTracks(collectionWithoutFallback?.trackIds, {
    enabled: !!collectionWithoutFallback?.trackIds
  })
  const { data: user } = useUser(collection?.playlist_owner_id, {
    enabled: !!collection?.playlist_owner_id
  })
  const { data: currentUserId } = useCurrentUserId()
  const playingUid = useSelector(getUid)
  const isBuffering = useSelector(getBuffering)
  const isPlaying = useSelector(getPlaying)
  const darkMode = useSelector((state: AppState) =>
    shouldShowDark(getTheme(state))
  )

  // Move mapDispatchToProps into component
  const goToRoute = useCallback(
    (route: string) => {
      dispatch(push(route))
    },
    [dispatch]
  )

  const shareCollection = useCallback(
    (collectionId: ID) => {
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId,
          source: ShareSource.TILE
        })
      )
    },
    [dispatch]
  )

  const handleSaveCollection = useCallback(
    (collectionId: ID, isFeed: boolean) => {
      dispatch(saveCollection(collectionId, FavoriteSource.TILE, isFeed))
    },
    [dispatch]
  )

  const handleUnsaveCollection = useCallback(
    (collectionId: ID) => {
      dispatch(unsaveCollection(collectionId, FavoriteSource.TILE))
    },
    [dispatch]
  )

  const handleRepostCollection = useCallback(
    (collectionId: ID, isFeed: boolean) => {
      dispatch(repostCollection(collectionId, RepostSource.TILE, isFeed))
    },
    [dispatch]
  )

  const handleUnrepostCollection = useCallback(
    (collectionId: ID) => {
      dispatch(undoRepostCollection(collectionId, RepostSource.TILE))
    },
    [dispatch]
  )

  const clickOverflow = useCallback(
    (collectionId: ID, overflowActions: OverflowAction[]) => {
      dispatch(
        open({
          source: OverflowSource.COLLECTIONS,
          id: collectionId,
          overflowActions
        })
      )
    },
    [dispatch]
  )

  const setRepostPlaylistId = useCallback(
    (collectionId: ID) => {
      dispatch(setRepost(collectionId, RepostType.COLLECTION))
    },
    [dispatch]
  )

  const setFavoritePlaylistId = useCallback(
    (collectionId: ID) => {
      dispatch(setFavorite(collectionId, FavoriteType.PLAYLIST))
    },
    [dispatch]
  )

  const record = useRecord()
  const isActive = useMemo(() => {
    return tracks?.some((track) => track.uid === playingUid) ?? false
  }, [tracks, playingUid])
  const hasStreamAccess = !!collection?.access?.stream

  const isOwner = collection.playlist_owner_id === currentUserId

  const toggleSave = useCallback(() => {
    if (collection.has_current_user_saved) {
      handleUnsaveCollection(collection.playlist_id)
    } else {
      handleSaveCollection(collection.playlist_id, isFeed)
    }
  }, [collection, handleUnsaveCollection, handleSaveCollection, isFeed])

  const toggleRepost = useCallback(() => {
    if (collection.has_current_user_reposted) {
      handleUnrepostCollection(collection.playlist_id)
    } else {
      handleRepostCollection(collection.playlist_id, isFeed)
    }
  }, [collection, handleUnrepostCollection, handleRepostCollection, isFeed])

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
      hasStreamAccess
        ? collection.has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST
        : null,
      hasStreamAccess
        ? collection.has_current_user_saved && hasStreamAccess
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE
        : null,
      collection.is_album
        ? OverflowAction.VIEW_ALBUM_PAGE
        : OverflowAction.VIEW_PLAYLIST_PAGE,
      isOwner ? OverflowAction.PUBLISH_PLAYLIST : null,
      isOwner
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
  }, [hasStreamAccess, collection, isOwner, clickOverflow])

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
      isOwner={isOwner}
      goToCollectionPage={goToCollectionPage}
      toggleSave={toggleSave}
      toggleRepost={toggleRepost}
      onShare={onShare}
      onClickOverflow={onClickOverflow}
      makeGoToRepostsPage={makeGoToRepostsPage}
      makeGoToFavoritesPage={makeGoToFavoritesPage}
      darkMode={darkMode}
      isMatrix={isMatrix()}
      isTrending={isTrending}
      variant={variant}
      isUnlisted={collection.is_private}
      isStreamGated={collection.is_stream_gated}
      hasStreamAccess={!!collection.access?.stream}
      streamConditions={collection.stream_conditions}
      source={source}
    />
  )
}

export default memo(ConnectedPlaylistTile)
