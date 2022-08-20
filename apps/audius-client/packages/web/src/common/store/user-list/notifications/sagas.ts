import { call, put, select } from 'typed-redux-saga'

import { fetchUsers as retrieveUsers } from 'common/store/cache/users/sagas'
import { getNotificationById } from 'common/store/notifications/selectors'
import {
  getUserIds,
  getId,
  getUserList
} from 'common/store/user-list/notifications/selectors'
import UserListSagaFactory from 'common/store/user-list/sagas'

import { getNotificationError } from './actions'
import { watchRepostsError } from './errorSagas'
import { USER_LIST_TAG } from './types'

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getNotificationError(id, error.message))
  }
}

function* fetchUsers(currentPage: number, pageSize: number) {
  const emptyUsers = { userIds: [], hasMore: false }

  const notificationId = yield* select(getId)
  if (!notificationId) return emptyUsers

  const notification = yield* select(getNotificationById, notificationId)
  if (!notification) return emptyUsers

  if (!('userIds' in notification)) return emptyUsers

  const { userIds } = notification
  const offset = currentPage * pageSize
  const hasMore = userIds.length > offset + pageSize
  const paginatedUserIds = userIds.slice(offset, offset + pageSize)

  // Retrieve the users in case they're not yet cached
  yield* call(retrieveUsers, paginatedUserIds)

  // Append new users to existing ones
  const existingUserIds = yield* select(getUserIds)
  const fullList = [...existingUserIds, ...paginatedUserIds]

  return { userIds: fullList, hasMore }
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchRepostsError]
}
