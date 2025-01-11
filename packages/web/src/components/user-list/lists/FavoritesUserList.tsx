import { useFavorites } from '@audius/common/api'
import { favoritesUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const FavoritesUserList = () => {
  const trackId = useSelector(favoritesUserListSelectors.getId)
  const query = useFavorites({ trackId })

  return <UserList {...query} />
}
