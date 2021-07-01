import { UserListStoreState } from 'containers/user-list/store/types'
import { ID } from 'models/common/Identifiers'

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
