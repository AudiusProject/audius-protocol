import { UserListStoreState } from 'store/user-list/types'

export type SearchOwnState = {
  query: string
}

export type SearchUserListState = {
  searchPage: SearchOwnState
  userList: UserListStoreState
}

export const SEARCH_USER_LIST_TAG = 'SEARCH'
