import { ID, User } from '@audius/common/models'
import {
  cacheUsersSelectors,
  UserListSagaFactory,
  followersUserListActions,
  followersUserListSelectors,
  FOLLOWERS_USER_LIST_TAG as USER_LIST_TAG
} from '@audius/common/store'
import { put, select } from 'typed-redux-saga'

import { watchFollowersError } from 'common/store/user-list/followers/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getFollowersError } = followersUserListActions
const { getId, getUserList, getUserIds } = followersUserListSelectors
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
