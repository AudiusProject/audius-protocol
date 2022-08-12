import { ID, User } from '@audius/common'
import { put, select } from 'typed-redux-saga/macro'

import { getUser } from 'common/store/cache/users/selectors'
import { getFollowersError } from 'common/store/user-list/followers/actions'
import { watchFollowersError } from 'common/store/user-list/followers/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/user-list/followers/selectors'
import { USER_LIST_TAG } from 'common/store/user-list/followers/types'
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
    const users = await apiClient.getFollowers({
      currentUserId,
      profileUserId: entityId,
      limit,
      offset
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.follower_count,
  includeCurrentUser: (u) => u.does_current_user_follow
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getFollowersError(id, error.message))
  }
}

function* getFollowers(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
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
