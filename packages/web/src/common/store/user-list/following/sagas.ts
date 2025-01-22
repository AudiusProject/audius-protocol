import { userMetadataListFromSDK } from '@audius/common/adapters'
import { ID, User } from '@audius/common/models'
import {
  cacheUsersSelectors,
  UserListSagaFactory,
  followingUserListActions,
  followingUserListSelectors,
  FOLLOWING_USER_LIST_TAG,
  getSDK
} from '@audius/common/store'
import { Id, OptionalId } from '@audius/sdk'
import { call, put, select } from 'typed-redux-saga'

import { watchFollowingError } from 'common/store/user-list/following/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getId, getUserList, getUserIds } = followingUserListSelectors
const { getFollowingError } = followingUserListActions
const { getUser } = cacheUsersSelectors

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: function* ({
    limit,
    offset,
    entityId,
    currentUserId
  }) {
    const sdk = yield* getSDK()
    const { data } = yield* call(
      [sdk.full.users, sdk.full.users.getFollowing],
      {
        id: Id.parse(entityId),
        limit,
        offset,
        userId: OptionalId.parse(currentUserId)
      }
    )
    const users = userMetadataListFromSDK(data)

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
