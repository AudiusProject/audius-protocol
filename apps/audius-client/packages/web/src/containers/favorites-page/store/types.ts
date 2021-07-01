import { UserListStoreState } from 'containers/user-list/store/types'
import { FavoriteType } from 'models/Favorite'
import { ID } from 'models/common/Identifiers'

export type FavoritesOwnState = {
  id: ID | null
  favoriteType: FavoriteType
}

export type FavoritesPageState = {
  favoritesPage: FavoritesOwnState
  userList: UserListStoreState
}
