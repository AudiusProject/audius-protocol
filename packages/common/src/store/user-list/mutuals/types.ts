import { UserListStoreState } from '~/store/user-list/types'

import { ID } from '../../../models'

export type MutualsOwnState = {
  id: ID | null
}

export type MutualsPageState = {
  followingPage: MutualsOwnState
  userList: UserListStoreState
}

export const MUTUALS_USER_LIST_TAG = 'MUTUALS'
