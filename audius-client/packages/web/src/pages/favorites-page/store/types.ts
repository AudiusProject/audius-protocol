import { FavoriteType } from 'common/models/Favorite'
import { ID } from 'common/models/Identifiers'
import { UserListStoreState } from 'components/user-list/store/types'

export type FavoritesOwnState = {
  id: ID | null
  favoriteType: FavoriteType
}

export type FavoritesPageState = {
  favoritesPage: FavoritesOwnState
  userList: UserListStoreState
}
