import { useFavorites } from '@audius/common/api'
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

  const query = useFavorites(
    { trackId: id },
    { enabled: favoriteType === FavoriteType.TRACK }
  )

  return (
    <UserListScreen title={messages.title} titleIcon={IconHeart}>
      <UserListV2 {...query} tag='FAVORITES' />
    </UserListScreen>
  )
}
