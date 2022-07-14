import { ID } from '@audius/common'

import { FavoriteType } from 'common/models/Favorite'
import { UserListStoreState } from 'common/store/user-list/types'

export type FavoritesOwnState = {
  id: ID | null
  favoriteType: FavoriteType
}

export type FavoritesPageState = {
  favoritesPage: FavoritesOwnState
  userList: UserListStoreState
}
