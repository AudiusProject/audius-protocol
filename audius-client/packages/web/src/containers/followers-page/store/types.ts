import { ID } from 'common/models/Identifiers'
import { UserListStoreState } from 'containers/user-list/store/types'

export type FollowersOwnState = {
  id: ID | null
}

export type FollowersPageState = {
  followersPage: FollowersOwnState
  userList: UserListStoreState
}
