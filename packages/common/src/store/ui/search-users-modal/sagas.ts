import { call, put, select, takeLatest } from 'typed-redux-saga'

import { User } from '~/models/User'
import { accountSelectors } from '~/store/account'
import { processAndCacheUsers } from '~/store/cache/users/utils'
import { getContext } from '~/store/effects'
import { SearchKind } from '~/store/pages/search-results/types'
import * as searchUsersModalSelectors from '~/store/ui/search-users-modal/selectors'
import { actions as searchUsersModalActions } from '~/store/ui/search-users-modal/slice'

const { getUserId } = accountSelectors
const { searchUsers, searchUsersSucceeded } = searchUsersModalActions
const { getUserList } = searchUsersModalSelectors

function* doSearchUsers(action: ReturnType<typeof searchUsers>) {
  const { query, limit = 15 } = action.payload
  const apiClient = yield* getContext('apiClient')
  const userList = yield* select(getUserList)
  try {
    const currentUserId = yield* select(getUserId)
    const res = yield* call([apiClient, apiClient.getSearchFull], {
      currentUserId,
      query,
      kind: SearchKind.USERS,
      offset: userList.userIds.length,
      limit
    })
    const users = Object.values(res.users) as User[]
    yield* call(processAndCacheUsers, users)
    yield* put(
      searchUsersSucceeded({ userIds: users.map((u) => u.user_id), limit })
    )
  } catch (e) {
    console.error(e)
  }
}

function* watchSearchUsers() {
  yield* takeLatest(searchUsers, doSearchUsers)
}

export default function sagas() {
  return [watchSearchUsers]
}
