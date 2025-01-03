import {
  ID,
  User,
  Id,
  supportedUserMetadataListFromSDK,
  OptionalId,
  SupportedUserMetadata
} from '@audius/common/models'
import {
  cacheUsersSelectors,
  UserListSagaFactory,
  supportingUserListActions,
  supportingUserListSelectors,
  SUPPORTING_USER_LIST_TAG,
  getSDK
} from '@audius/common/store'
import { stringWeiToBN } from '@audius/common/utils'
import { call, put, select } from 'typed-redux-saga'

import { watchSupportingError } from 'common/store/user-list/supporting/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getId, getUserList, getUserIds } = supportingUserListSelectors
const { getSupportingError } = supportingUserListActions
const { getUser } = cacheUsersSelectors

type SupportingProcessExtraType = {
  userId: ID
  supportingList: SupportedUserMetadata[]
}

const provider = createUserListProvider<User, SupportingProcessExtraType>({
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
      [sdk.full.users, sdk.full.users.getSupportedUsers],
      {
        id: Id.parse(entityId),
        limit,
        offset,
        userId: OptionalId.parse(currentUserId)
      }
    )
    const supporting = supportedUserMetadataListFromSDK(data)

    const users = supporting
      .sort((s1, s2) => {
        const amount1BN = stringWeiToBN(s1.amount)
        const amount2BN = stringWeiToBN(s2.amount)
        return amount1BN.gte(amount2BN) ? -1 : 1
      })
      .map((s) => s.receiver)
    return { users, extra: { userId: entityId, supportingList: supporting } }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.supporting_count,
  includeCurrentUser: (_) => false,
  /**
   * Tipping sagas for user list modals are special in that they require
   * tipping data on top of the otherwise independent user data.
   * We need to store the supporting data for the user
   * in the store. So we use this function, which is optional
   * in the interface, to update the store.
   */
  processExtra: function* ({ userId, supportingList }) {}
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield put(getSupportingError(id, error.message))
  }
}

function* getSupporting(currentPage: number, pageSize: number) {
  const id: number | null = yield select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: SUPPORTING_USER_LIST_TAG,
  fetchUsers: getSupporting,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchSupportingError]
}
