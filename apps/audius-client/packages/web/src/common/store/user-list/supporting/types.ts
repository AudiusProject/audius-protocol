import { ID } from '@audius/common'

import { UserListStoreState } from 'common/store/user-list/types'

export type SupportingOwnState = {
  id: ID | null
}

export type SupportingPageState = {
  supportingPage: SupportingOwnState
  userList: UserListStoreState
}
