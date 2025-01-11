import { useFavorites } from '@audius/common/api'
import { favoritesUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const FavoritesUserList = () => {
  const userId = useSelector(favoritesUserListSelectors.getId)
  const query = useFavorites({ userId })

  return <UserListV2 {...query} />
}
