import { ID } from 'common/models/Identifiers'
import { UserListStoreState } from 'common/store/user-list/types'

export type SupportingOwnState = {
  id: ID | null
}

export type SupportingPageState = {
  supportingPage: SupportingOwnState
  userList: UserListStoreState
}
