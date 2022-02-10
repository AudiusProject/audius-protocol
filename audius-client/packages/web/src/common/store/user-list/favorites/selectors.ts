import { CommonState } from 'common/store'

export const getId = (state: CommonState) =>
  state.ui.userList.favorites.favoritesPage.id
export const getFavoriteType = (state: CommonState) =>
  state.ui.userList.favorites.favoritesPage.favoriteType
export const getUserList = (state: CommonState) =>
  state.ui.userList.favorites.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.favorites.userList.userIds
