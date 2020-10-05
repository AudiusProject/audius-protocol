import UserListSagaFactory from 'containers/user-list/store/sagas'
import { USER_LIST_TAG } from '../FollowersPage'
import { put, select } from 'redux-saga/effects'
import { getId, getUserList, getUserIds } from './selectors'
import { ID } from 'models/common/Identifiers'
import { createUserListProvider } from 'containers/user-list/utils'
import { getFollowersError } from './actions'
import { watchFollowersError } from './errorSagas'
import User from 'models/User'
import { getUser } from 'store/cache/users/selectors'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: ({
    limit,
    offset,
    entityId,
    currentUserId
  }: {
    limit: number
    offset: number
    entityId: ID
    currentUserId: ID | null
  }) => {
    return apiClient.getFollowers({
      currentUserId,
      profileUserId: entityId,
      limit: limit,
      offset: offset
    })
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.follower_count,
  includeCurrentUser: u => u.does_current_user_follow
})

function* errorDispatcher(error: Error) {
  const id = yield select(getId)
  yield put(getFollowersError(id, error.message))
}

function* getFollowers(currentPage: number, pageSize: number) {
  const id: number | null = yield select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getFollowers,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFollowersError]
}
