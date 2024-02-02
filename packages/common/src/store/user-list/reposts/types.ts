import { UserListStoreState } from '~/store/user-list/types'

import { ID } from '../../../models'

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

export const REPOSTS_USER_LIST_TAG = 'REPOSTS'
