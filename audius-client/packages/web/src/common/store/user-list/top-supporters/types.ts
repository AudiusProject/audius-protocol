import { ID } from 'common/models/Identifiers'
import { UserListStoreState } from 'common/store/user-list/types'

export type TopSupportersOwnState = {
  id: ID | null
}

export type TopSupportersPageState = {
  topSupportersPage: TopSupportersOwnState
  userList: UserListStoreState
}
