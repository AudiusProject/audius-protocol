import { UserListStoreState } from '~/store/user-list/types'

import { ID } from '../../../models'

export type SupportingOwnState = {
  id: ID | null
}

export type SupportingPageState = {
  supportingPage: SupportingOwnState
  userList: UserListStoreState
}

export const SUPPORTING_USER_LIST_TAG = 'SUPPORTING'
