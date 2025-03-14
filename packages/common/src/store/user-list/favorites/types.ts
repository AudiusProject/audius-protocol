import { ID, FavoriteType } from '../../../models'

export type FavoritesPageState = {
  id: ID | null
  favoriteType: FavoriteType
}

export const FAVORITES_USER_LIST_TAG = 'FAVORITES'
