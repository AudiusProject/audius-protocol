import {
  ID,
  Id,
  OptionalId,
  SupporterMetadata,
  User,
  supporterMetadataListFromSDK
} from '@audius/common/models'
import {
  cacheUsersSelectors,
  UserListSagaFactory,
  topSupportersUserListActions,
  topSupportersUserListSelectors,
  TOP_SUPPORTERS_USER_LIST_TAG,
  getSDK
} from '@audius/common/store'
import { call, put, select } from 'typed-redux-saga'

import { watchTopSupportersError } from 'common/store/user-list/top-supporters/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getTopSupportersError } = topSupportersUserListActions
const { getId, getUserList, getUserIds } = topSupportersUserListSelectors
const { getUser } = cacheUsersSelectors

type SupportersProcessExtraType = {
  userId: ID
  supporters: SupporterMetadata[]
}

const provider = createUserListProvider<User, SupportersProcessExtraType>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: function* ({
    limit,
    offset,
    entityId,
    currentUserId
  }) {
    const sdk = yield* getSDK()

    const { data = [] } = yield* call(
      [sdk.full.users, sdk.full.users.getSupporters],
      {
        id: Id.parse(entityId),
        limit,
        offset,
        userId: OptionalId.parse(currentUserId)
      }
    )
    const supporters = supporterMetadataListFromSDK(data)

    const users = supporters
      .sort((s1, s2) => s1.rank - s2.rank)
      .map((s) => s.sender)
    return { users, extra: { userId: entityId, supporters } }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.supporter_count,
  includeCurrentUser: (_) => false,
  /**
   * Tipping sagas for user list modals are special in that they require
   * tipping data on top of the otherwise independent user data.
   * We need to store the supporters data for the user
   * in the store. So we use this function, which is optional
   * in the interface, to update the store.
   */
  processExtra: function* ({ userId, supporters }) {}
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getTopSupportersError(id, error.message))
  }
}

function* getTopSupporters(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: TOP_SUPPORTERS_USER_LIST_TAG,
  fetchUsers: getTopSupporters,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchTopSupportersError]
}
