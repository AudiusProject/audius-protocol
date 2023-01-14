import {
  UserListSagaFactory,
  SEARCH_USER_LIST_TAG,
  searchUserListSelectors,
  SearchKind,
  accountSelectors,
  User
} from '@audius/common'
import { select, call } from 'typed-redux-saga'

import { processAndCacheUsers } from 'common/store/cache/users/utils'
import { apiClient } from 'services/audius-api-client'

const { getQuery, getUserList } = searchUserListSelectors
const { getUserId } = accountSelectors

function* searchUsers(currentPage: number, pageSize: number) {
  const query = yield* select(getQuery)
  const currentUserId = yield* select(getUserId)
  const res = yield* call([apiClient, apiClient.getSearchFull], {
    currentUserId,
    query,
    kind: SearchKind.USERS,
    offset: currentPage * pageSize,
    limit: pageSize
  })

  const users = Object.values(res.users)
  yield* processAndCacheUsers(users as User[])

  return {
    userIds: users.map((u) => (u as User).user_id),
    hasMore: false
  }
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: SEARCH_USER_LIST_TAG,
  fetchUsers: searchUsers,
  stateSelector: getUserList,
  errorDispatcher: function* () {}
})

export default function sagas() {
  return [userListSagas]
}
