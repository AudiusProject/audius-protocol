import { useFavorites } from '@audius/common/api'
import { FavoriteType } from '@audius/common/models'

import { IconHeart } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Favorites'
}

export const FavoritedScreen = () => {
  const { params } = useRoute<'Favorited'>()
  const { id, favoriteType } = params

  const query = useFavorites(
    { trackId: id },
    { enabled: favoriteType === FavoriteType.TRACK }
  )

  return (
    <UserListScreen title={messages.title} titleIcon={IconHeart}>
      <UserList {...query} tag='FAVORITES' />
    </UserListScreen>
  )
}
