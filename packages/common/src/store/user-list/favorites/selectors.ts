import { CommonState } from '~/store/commonStore'

export const getId = (state: CommonState) => state.ui.userList.favorites.id
export const getFavoriteType = (state: CommonState) =>
  state.ui.userList.favorites.favoriteType
