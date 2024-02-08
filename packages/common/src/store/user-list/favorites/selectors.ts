import { CommonState } from '~/store/commonStore'

import { FavoriteType } from '../../../models/Favorite'
import { ID } from '../../../models/Identifiers'
import { UserListStoreState } from '../types'

export const getId = (state: CommonState): ID | null =>
  state.ui.userList.favorites.favoritesPage.id
export const getFavoriteType = (state: CommonState): FavoriteType =>
  state.ui.userList.favorites.favoritesPage.favoriteType
export const getUserList = (state: CommonState): UserListStoreState =>
  state.ui.userList.favorites.userList
export const getUserIds = (state: CommonState): ID[] =>
  state.ui.userList.favorites.userList.userIds
