import { useTrackFavorites, useCollectionFavorites } from '@audius/common/api'
import { FavoriteType } from '@audius/common/models'

import { IconHeart } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

const messages = {
  title: 'Favorites'
}

export const FavoritedScreen = () => {
  const { params } = useRoute<'Favorited'>()
  const { id, favoriteType } = params

  const trackQuery = useTrackFavorites(
    { trackId: id },
    { enabled: favoriteType === FavoriteType.TRACK }
  )

  const collectionQuery = useCollectionFavorites(
    { collectionId: id },
    { enabled: favoriteType === FavoriteType.PLAYLIST }
  )

  const { data, isFetchingNextPage, isPending, fetchNextPage } =
    favoriteType === FavoriteType.TRACK ? trackQuery : collectionQuery

  return (
    <UserListScreen title={messages.title} titleIcon={IconHeart}>
      <UserListV2
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isPending={isPending}
        fetchNextPage={fetchNextPage}
        tag='FAVORITES'
      />
    </UserListScreen>
  )
}
