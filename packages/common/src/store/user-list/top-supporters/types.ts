import { UserListStoreState } from '~/store/user-list/types'

import { ID } from '../../../models'

export type TopSupportersOwnState = {
  id: ID | null
}

export type TopSupportersPageState = {
  topSupportersPage: TopSupportersOwnState
  userList: UserListStoreState
}

export const TOP_SUPPORTERS_USER_LIST_TAG = 'TOP SUPPORTERS'
