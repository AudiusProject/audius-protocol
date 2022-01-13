import { AppState } from 'store/types'

export const getId = (state: AppState) =>
  state.application.pages.favorites.favoritesPage.id
export const getFavoriteType = (state: AppState) =>
  state.application.pages.favorites.favoritesPage.favoriteType
export const getUserList = (state: AppState) =>
  state.application.pages.favorites.userList
export const getUserIds = (state: AppState) =>
  state.application.pages.favorites.userList.userIds
