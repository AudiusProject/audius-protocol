import { useCallback, useMemo } from 'react'

import {
  FavoriteSource,
  PlaybackSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import { Collection } from 'audius-client/src/common/models/Collection'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import {
  EnhancedCollectionTrack,
  getCollection,
  getTracksFromCollection
} from 'audius-client/src/common/store/cache/collections/selectors'
import { getUserFromCollection } from 'audius-client/src/common/store/cache/users/selectors'
import {
  repostCollection,
  saveCollection,
  undoRepostCollection,
  unsaveCollection
} from 'audius-client/src/common/store/social/collections/actions'
import {
  OverflowAction,
  OverflowSource
} from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'audius-client/src/common/store/ui/share-modal/slice'
import { albumPage, playlistPage } from 'audius-client/src/utils/route'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { isEqual } from 'lodash'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { CollectionTileTrackList } from './CollectionTileTrackList'
import { LineupTile } from './LineupTile'
import { LineupItemProps } from './types'

export const CollectionTile = (props: LineupItemProps) => {
  const { uid } = props

  const collection: Collection = useSelectorWeb(
    state => getCollection(state, { uid }),
    isEqual
  )

  const tracks: EnhancedCollectionTrack[] = useSelectorWeb(
    state => getTracksFromCollection(state, { uid }),
    isEqual
  )

  const user: User = useSelectorWeb(
    state => getUserFromCollection(state, { uid }),
    isEqual
  )

  if (!collection || !tracks || !user) {
    console.warn(
      'Collection, tracks, or user missing for CollectionTile, preventing render'
    )
    return null
  }

  if (collection.is_delete || user?.is_deactivated) {
    return null
  }

  return (
    <CollectionTileComponent
      {...props}
      collection={collection}
      tracks={tracks}
      user={user}
    />
  )
}

type CollectionTileProps = LineupItemProps & {
  collection: Collection
  tracks: EnhancedCollectionTrack[]
  user: User
}

const CollectionTileComponent = ({
  collection,
  togglePlay,
  tracks,
  user,
  ...lineupTileProps
}: CollectionTileProps) => {
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const currentUserId = useSelectorWeb(getUserId)

  const {
    has_current_user_reposted,
    has_current_user_saved,
    is_album,
    playlist_id,
    playlist_name,
    playlist_owner_id
  } = collection

  const isOwner = playlist_owner_id === currentUserId

  const routeWeb = useMemo(() => {
    return collection.is_album
      ? albumPage(user.handle, collection.playlist_name, collection.playlist_id)
      : playlistPage(
          user.handle,
          collection.playlist_name,
          collection.playlist_id
        )
  }, [collection, user])

  const handlePress = useCallback(() => {
    const trackUid = tracks[0] ? tracks[0].uid : null
    const trackId = tracks[0] ? tracks[0].track_id : null
    if (!trackUid || !trackId) {
      return
    }
    togglePlay(trackUid, trackId, PlaybackSource.PLAYLIST_TILE_TRACK)
  }, [togglePlay, tracks])

  const handlePressTitle = useCallback(() => {
    navigation.push({
      // TODO: update to `collection` screen
      native: { screen: 'track', params: { id: playlist_id } },
      web: { route: routeWeb }
    })
  }, [playlist_id, routeWeb, navigation])

  const duration = useMemo(() => {
    return tracks.reduce(
      (duration: number, track: Track) => duration + track.duration,
      0
    )
  }, [tracks])

  const handlePressOverflow = useCallback(() => {
    if (playlist_id === undefined) {
      return
    }
    const overflowActions = [
      has_current_user_reposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      has_current_user_saved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      is_album
        ? OverflowAction.VIEW_ALBUM_PAGE
        : OverflowAction.VIEW_PLAYLIST_PAGE,
      isOwner && !is_album ? OverflowAction.PUBLISH_PLAYLIST : null,
      isOwner && !is_album ? OverflowAction.DELETE_PLAYLIST : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.COLLECTIONS,
        id: playlist_id,
        overflowActions
      })
    )
  }, [
    playlist_id,
    dispatchWeb,
    isOwner,
    has_current_user_reposted,
    has_current_user_saved,
    is_album
  ])

  const handlePressShare = useCallback(() => {
    if (playlist_id === undefined) {
      return
    }
    dispatchWeb(
      requestOpenShareModal({
        type: 'collection',
        collectionId: playlist_id,
        source: ShareSource.TILE
      })
    )
  }, [dispatchWeb, playlist_id])

  const handlePressSave = useCallback(() => {
    if (playlist_id === undefined) {
      return
    }
    if (has_current_user_saved) {
      dispatchWeb(unsaveCollection(playlist_id, FavoriteSource.TILE))
    } else {
      dispatchWeb(saveCollection(playlist_id, FavoriteSource.TILE))
    }
  }, [playlist_id, dispatchWeb, has_current_user_saved])

  const handlePressRepost = useCallback(() => {
    if (playlist_id === undefined) {
      return
    }
    if (has_current_user_reposted) {
      dispatchWeb(undoRepostCollection(playlist_id, RepostSource.TILE))
    } else {
      dispatchWeb(repostCollection(playlist_id, RepostSource.TILE))
    }
  }, [playlist_id, dispatchWeb, has_current_user_reposted])

  return (
    <LineupTile
      {...lineupTileProps}
      duration={duration}
      id={playlist_id}
      onPress={handlePress}
      onPressOverflow={handlePressOverflow}
      onPressRepost={handlePressRepost}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      onPressTitle={handlePressTitle}
      title={playlist_name}
      item={collection}
      user={user}
    >
      <CollectionTileTrackList tracks={tracks} onPress={handlePressTitle} />
    </LineupTile>
  )
}
