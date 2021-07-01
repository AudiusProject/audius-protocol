import { UserListStoreState } from 'containers/user-list/store/types'
import { ID } from 'models/common/Identifiers'

export type FollowersOwnState = {
  id: ID | null
}

export type FollowersPageState = {
  followersPage: FollowersOwnState
  userList: UserListStoreState
}
