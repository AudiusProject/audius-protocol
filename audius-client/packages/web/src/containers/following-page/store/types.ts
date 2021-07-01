import { UserListStoreState } from 'containers/user-list/store/types'
import { ID } from 'models/common/Identifiers'

export type FollowingOwnState = {
  id: ID | null
}

export type FollowingPageState = {
  followingPage: FollowingOwnState
  userList: UserListStoreState
}
