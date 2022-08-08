import { ID, FavoriteType } from '@audius/common'

import { UserListStoreState } from 'common/store/user-list/types'

export type FavoritesOwnState = {
  id: ID | null
  favoriteType: FavoriteType
}

export type FavoritesPageState = {
  favoritesPage: FavoritesOwnState
  userList: UserListStoreState
}

export const USER_LIST_TAG = 'FAVORITES'
