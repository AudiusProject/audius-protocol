import { UserListStoreState } from '~/store/user-list/types'

import { ID } from '../../../models'

export type RemixersOwnState = {
  id: ID | null
  trackId?: ID
}

export type RemixersPageState = {
  remixersPage: RemixersOwnState
  userList: UserListStoreState
}

export const REMIXERS_USER_LIST_TAG = 'REMIXERS'
