import { useCallback, useMemo } from 'react'

import type { EnhancedCollectionTrack, CommonState } from '@audius/common'
import {
  playerSelectors,
  accountSelectors,
  cacheCollectionsSelectors,
  cacheUsersSelectors,
  collectionsSocialActions,
  OverflowAction,
  OverflowSource,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  RepostType
} from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  FavoriteType,
  SquareSizes
} from '@audius/common/models'
import type { Collection, Track, User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { removeNullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionImage } from 'app/components/image/CollectionImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { setVisibility } from 'app/store/drawers/slice'
import { getIsCollectionMarkedForDownload } from 'app/store/offline-downloads/selectors'

import type { ImageProps } from '../image/FastImage'

import { CollectionTileTrackList } from './CollectionTileTrackList'
import { LineupTile } from './LineupTile'
import type { LineupItemProps } from './types'
const { getUid } = playerSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const {
  repostCollection,
  saveCollection,
  undoRepostCollection,
  unsaveCollection
} = collectionsSocialActions
const { getUserFromCollection } = cacheUsersSelectors
const { getCollection, getTracksFromCollection } = cacheCollectionsSelectors
const getUserId = accountSelectors.getUserId

export const CollectionTile = (props: LineupItemProps) => {
  const { uid, collection: collectionOverride, tracks: tracksOverride } = props

  const collection = useProxySelector(
    (state) => {
      return collectionOverride ?? getCollection(state, { uid })
    },
    [collectionOverride, uid]
  )

  const tracks = useProxySelector(
    (state) => {
      return tracksOverride ?? getTracksFromCollection(state, { uid })
    },
    [tracksOverride, uid]
  )

  const user = useProxySelector(
    (state) => getUserFromCollection(state, { uid }),
    [uid]
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
  variant,
  ...lineupTileProps
}: CollectionTileProps) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const currentUserId = useSelector(getUserId)
  const currentTrack = useSelector((state: CommonState) => {
    const uid = getUid(state)
    return tracks.find((track) => track.uid === uid) ?? null
  })
  const isPlayingUid = useSelector((state: CommonState) => {
    const uid = getUid(state)
    return tracks.some((track) => track.uid === uid)
  })

  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )

  const {
    has_current_user_reposted,
    has_current_user_saved,
    is_album,
    playlist_id,
    playlist_name,
    playlist_owner_id
  } = collection

  const isOwner = playlist_owner_id === currentUserId

  const isCollectionMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(playlist_id.toString())
  )

  const renderImage = useCallback(
    (props: ImageProps) => (
      <CollectionImage
        collection={collection}
        size={SquareSizes.SIZE_150_BY_150}
        {...props}
      />
    ),
    [collection]
  )

  const handlePress = useCallback(() => {
    if (!tracks.length) return

    togglePlay({
      uid: currentTrack?.uid ?? tracks[0]?.uid ?? null,
      id: currentTrack?.track_id ?? tracks[0]?.track_id ?? null,
      source: PlaybackSource.PLAYLIST_TILE_TRACK
    })
  }, [currentTrack, togglePlay, tracks])

  const handlePressTitle = useCallback(() => {
    navigation.push('Collection', { id: playlist_id })
  }, [playlist_id, navigation])

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
      is_album
        ? OverflowAction.VIEW_ALBUM_PAGE
        : OverflowAction.VIEW_PLAYLIST_PAGE,
      isOwner && (!is_album || isEditAlbumsEnabled)
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && (!is_album || isEditAlbumsEnabled)
        ? is_album
          ? OverflowAction.DELETE_ALBUM
          : OverflowAction.DELETE_PLAYLIST
        : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.COLLECTIONS,
        id: playlist_id,
        overflowActions
      })
    )
  }, [playlist_id, is_album, isOwner, isEditAlbumsEnabled, dispatch])

  const handlePressShare = useCallback(() => {
    if (playlist_id === undefined) {
      return
    }
    dispatch(
      requestOpenShareModal({
        type: 'collection',
        collectionId: playlist_id,
        source: ShareSource.TILE
      })
    )
  }, [dispatch, playlist_id])

  const handlePressSave = useCallback(() => {
    if (playlist_id === undefined) {
      return
    }
    if (has_current_user_saved) {
      if (isCollectionMarkedForDownload) {
        dispatch(
          setVisibility({
            drawer: 'UnfavoriteDownloadedCollection',
            visible: true,
            data: { collectionId: playlist_id }
          })
        )
      } else {
        dispatch(unsaveCollection(playlist_id, FavoriteSource.TILE))
      }
    } else {
      dispatch(saveCollection(playlist_id, FavoriteSource.TILE))
    }
  }, [
    playlist_id,
    has_current_user_saved,
    dispatch,
    isCollectionMarkedForDownload
  ])

  const handlePressRepost = useCallback(() => {
    if (playlist_id === undefined) {
      return
    }
    if (has_current_user_reposted) {
      dispatch(undoRepostCollection(playlist_id, RepostSource.TILE))
    } else {
      dispatch(repostCollection(playlist_id, RepostSource.TILE))
    }
  }, [playlist_id, dispatch, has_current_user_reposted])

  return (
    <LineupTile
      {...lineupTileProps}
      duration={duration}
      favoriteType={FavoriteType.PLAYLIST}
      repostType={RepostType.COLLECTION}
      id={playlist_id}
      renderImage={renderImage}
      isPlayingUid={isPlayingUid}
      onPress={handlePress}
      onPressOverflow={handlePressOverflow}
      onPressRepost={handlePressRepost}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      onPressTitle={handlePressTitle}
      title={playlist_name}
      item={collection}
      user={user}
      variant={variant}
    >
      <CollectionTileTrackList tracks={tracks} onPress={handlePressTitle} />
    </LineupTile>
  )
}
