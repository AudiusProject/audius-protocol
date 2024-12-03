import { Id, ID, User } from '@audius/common/models'
import { userMetadataListFromSDK } from '@audius/common/src/adapters'
import {
  cacheUsersSelectors,
  UserListSagaFactory,
  mutualsUserListActions,
  mutualsUserListSelectors,
  MUTUALS_USER_LIST_TAG,
  getContext,
  accountSelectors
} from '@audius/common/store'
import { call, put, select } from 'typed-redux-saga'

import { watchMutualsError } from 'common/store/user-list/mutuals/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getMutualsError } = mutualsUserListActions
const { getId, getUserList, getUserIds } = mutualsUserListSelectors
const { getUser } = cacheUsersSelectors
const { getUserId } = accountSelectors

type FetchMutualsConfig = {
  limit: number
  offset: number
  entityId: ID
  currentUserId: ID | null
}

const fetchMutualFollowers = function* ({
  limit,
  offset,
  entityId: userId
}: FetchMutualsConfig) {
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)

  const currentUserId = yield* select(getUserId)
  const response = yield* call(
    [sdk.full.users, sdk.full.users.getMutualFollowers],
    {
      userId: Id.parse(currentUserId),
      id: Id.parse(userId),
      limit,
      offset
    }
  )
  const users = userMetadataListFromSDK(response.data)
  return { users }
}

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: fetchMutualFollowers,
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.current_user_followee_follow_count,
  includeCurrentUser: (_) => false
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getMutualsError(id, error.message))
  }
}

function* getMutuals(currentPage: number, pageSize: number) {
  const id = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: MUTUALS_USER_LIST_TAG,
  fetchUsers: getMutuals,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchMutualsError]
}
