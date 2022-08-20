import { ID, User } from '@audius/common'
import { put, select } from 'typed-redux-saga'

import { getUser } from 'common/store/cache/users/selectors'
import { getFollowingError } from 'common/store/user-list/following/actions'
import { watchFollowingError } from 'common/store/user-list/following/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/user-list/following/selectors'
import { USER_LIST_TAG } from 'common/store/user-list/following/types'
import UserListSagaFactory from 'common/store/user-list/sagas'
import { createUserListProvider } from 'components/user-list/utils'

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId,
    apiClient
  }) => {
    const users = await apiClient.getFollowing({
      currentUserId,
      profileUserId: entityId,
      limit,
      offset
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.followee_count,

  includeCurrentUser: (_) => false
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getFollowingError(id, error.message))
  }
}

function* getFollowing(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getFollowing,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFollowingError]
}
