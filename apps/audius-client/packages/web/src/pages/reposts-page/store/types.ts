import { ID } from 'common/models/Identifiers'
import { UserListStoreState } from 'components/user-list/store/types'

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
