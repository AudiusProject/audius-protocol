import { ID } from '@audius/common'

import { UserListStoreState } from 'common/store/user-list/types'

export type FollowersOwnState = {
  id: ID | null
}

export type FollowersPageState = {
  followersPage: FollowersOwnState
  userList: UserListStoreState
}
