import { CommonState } from '~/store/commonStore'

import { ID } from '../../../models/Identifiers'
import { UserListStoreState } from '../types'

export const getId = (state: CommonState): ID | null =>
  state.ui.userList.remixers.remixersPage.id
export const getUserList = (state: CommonState): UserListStoreState =>
  state.ui.userList.remixers.userList
export const getUserIds = (state: CommonState): ID[] =>
  state.ui.userList.remixers.userList.userIds
export const getTrackId = (state: CommonState): ID | undefined =>
  state.ui.userList.remixers.remixersPage.trackId
