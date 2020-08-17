import { ID } from 'models/common/Identifiers'
import { UserListStoreState } from 'containers/user-list/store/types'
import { FavoriteType } from 'models/Favorite'

export type FavoritesOwnState = {
  id: ID | null
  favoriteType: FavoriteType
}

export type FavoritesPageState = {
  favoritesPage: FavoritesOwnState
  userList: UserListStoreState
}
