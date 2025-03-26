import {
  useTrackFavorites,
  useCollectionFavorites,
  useTrack,
  useCollection
} from '@audius/common/api'
import { FavoriteType } from '@audius/common/models'
import { favoritesUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const FavoritesUserList = () => {
  const entityId = useSelector(favoritesUserListSelectors.getId)
  const entityType = useSelector(favoritesUserListSelectors.getFavoriteType)

  const { data: followerCount } = useTrack(entityId, {
    select: (track) => track.save_count,
    enabled: entityType === FavoriteType.TRACK
  })

  const { data: collectionCount } = useCollection(entityId, {
    select: (collection) => collection.save_count,
    enabled: entityType === FavoriteType.PLAYLIST
  })

  const trackFavoritesQuery = useTrackFavorites(
    { trackId: entityId },
    { enabled: entityType === FavoriteType.TRACK }
  )

  const collectionFavoritesQuery = useCollectionFavorites(
    { collectionId: entityId },
    { enabled: entityType === FavoriteType.PLAYLIST }
  )

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    entityType === FavoriteType.TRACK
      ? trackFavoritesQuery
      : collectionFavoritesQuery

  return (
    <UserList
      data={data}
      totalCount={
        entityType === FavoriteType.TRACK ? followerCount : collectionCount
      }
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
    />
  )
}
