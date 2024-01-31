import { ID, User } from '@audius/common/models'
import {
  cacheUsersSelectors,
  UserListSagaFactory,
  followingUserListActions,
  followingUserListSelectors,
  FOLLOWING_USER_LIST_TAG
} from '@audius/common/store'
import { put, select } from 'typed-redux-saga'

import { watchFollowingError } from 'common/store/user-list/following/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getId, getUserList, getUserIds } = followingUserListSelectors
const { getFollowingError } = followingUserListActions
const { getUser } = cacheUsersSelectors

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
  tag: FOLLOWING_USER_LIST_TAG,
  fetchUsers: getFollowing,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFollowingError]
}
