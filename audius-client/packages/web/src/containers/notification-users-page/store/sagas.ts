import UserListSagaFactory from 'containers/user-list/store/sagas'
import { USER_LIST_TAG } from '../NotificationUsersPage'
import { put, select } from 'redux-saga/effects'
import { getId, getUserList } from './selectors'
import { getNotificationError } from './actions'
import { watchRepostsError } from './errorSagas'
import { getNotificationById } from 'containers/notification/store/selectors'

function* errorDispatcher(error: Error) {
  const id = yield select(getId)
  yield put(getNotificationError(id, error.message))
}

function* fetchUsers(currentPage: number, pageSize: number) {
  const notificationId = yield select(getId)
  const notification = yield select(getNotificationById, notificationId)
  if (!notification) return { userIds: [], hasMore: false }
  const { userIds } = notification
  const offset = currentPage * pageSize
  const hasMore = userIds.length > offset + pageSize
  const paginatedUserIds = userIds.slice(offset, offset + pageSize)
  return { userIds: paginatedUserIds, hasMore }
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
