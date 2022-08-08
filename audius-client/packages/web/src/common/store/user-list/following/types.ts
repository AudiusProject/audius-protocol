import { ID } from '@audius/common'

import { UserListStoreState } from 'common/store/user-list/types'

export type FollowingOwnState = {
  id: ID | null
}

export type FollowingPageState = {
  followingPage: FollowingOwnState
  userList: UserListStoreState
}

export const USER_LIST_TAG = 'FOLLOWING'
