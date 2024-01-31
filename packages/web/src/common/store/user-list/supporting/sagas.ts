import {
  cacheUsersSelectors,
  tippingActions,
  UserListSagaFactory,
  supportingUserListActions,
  supportingUserListSelectors,
  SUPPORTING_USER_LIST_TAG,
  SupportingMapForUser
} from '@audius/common/store'
import {} from '@audius/common'
import { ID, UserMetadata, User } from '@audius/common/models'
import {
  responseAdapter as adapter,
  SupportingResponse
} from '@audius/common/services'
import { decodeHashId, stringWeiToBN } from '@audius/common/utils'
import { put, select } from 'typed-redux-saga'

import { watchSupportingError } from 'common/store/user-list/supporting/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getId, getUserList, getUserIds } = supportingUserListSelectors
const { getSupportingError } = supportingUserListActions
const { setSupportingForUser } = tippingActions
const { getUser } = cacheUsersSelectors

type SupportingProcessExtraType = {
  userId: ID
  supportingList: SupportingResponse[]
}

const provider = createUserListProvider<User, SupportingProcessExtraType>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: async ({ limit, offset, entityId, apiClient }) => {
    const supporting =
      (await apiClient.getSupporting({
        userId: entityId,
        limit,
        offset
      })) || []
    const users = supporting
      .sort((s1, s2) => {
        const amount1BN = stringWeiToBN(s1.amount)
        const amount2BN = stringWeiToBN(s2.amount)
        return amount1BN.gte(amount2BN) ? -1 : 1
      })
      .map((s) => adapter.makeUser(s.receiver))
      .filter((user): user is UserMetadata => !!user)
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
  processExtra: function* ({ userId, supportingList }) {
    const supportingMap: SupportingMapForUser = {}
    supportingList.forEach((supporting: SupportingResponse) => {
      const supportingUserId = decodeHashId(supporting.receiver.id)
      if (supportingUserId) {
        supportingMap[supportingUserId] = {
          receiver_id: supportingUserId,
          rank: supporting.rank,
          amount: supporting.amount
        }
      }
    })
    yield put(
      setSupportingForUser({
        id: userId,
        supportingForUser: supportingMap
      })
    )
  }
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
