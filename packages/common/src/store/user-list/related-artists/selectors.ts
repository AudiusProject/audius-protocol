import { CommonState } from '~/store/commonStore'

import { ID } from '../../../models/Identifiers'
import { UserListStoreState } from '../types'

export const getId = (state: CommonState): ID | null =>
  state.ui.userList.relatedArtists.relatedArtistsPage.id
export const getUserList = (state: CommonState): UserListStoreState =>
  state.ui.userList.relatedArtists.userList
export const getUserIds = (state: CommonState): ID[] =>
  state.ui.userList.relatedArtists.userList.userIds
