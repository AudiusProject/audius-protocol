import { ID } from '@audius/common'

import { UserListStoreState } from 'common/store/user-list/types'

export enum RepostType {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION'
}

export type RepostsOwnState = {
  id: ID | null
  repostType: RepostType
}

export type RepostsPageState = {
  repostsPage: RepostsOwnState
  userList: UserListStoreState
}
