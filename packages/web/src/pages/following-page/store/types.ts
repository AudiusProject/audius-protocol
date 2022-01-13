import { ID } from 'common/models/Identifiers'
import { UserListStoreState } from 'components/user-list/store/types'

export type FollowingOwnState = {
  id: ID | null
}

export type FollowingPageState = {
  followingPage: FollowingOwnState
  userList: UserListStoreState
}
