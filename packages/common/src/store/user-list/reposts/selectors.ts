import { CommonState } from '~/store/commonStore'

import { ID } from '../../../models/Identifiers'
import { UserListStoreState } from '../types'

import { RepostType } from './types'

export const getId = (state: CommonState): ID | null =>
  state.ui.userList.reposts.repostsPage.id
export const getRepostsType = (state: CommonState): RepostType =>
  state.ui.userList.reposts.repostsPage.repostType
export const getUserList = (state: CommonState): UserListStoreState =>
  state.ui.userList.reposts.userList
export const getUserIds = (state: CommonState): ID[] =>
  state.ui.userList.reposts.userList.userIds
