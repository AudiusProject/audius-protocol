import {
  cacheUsersSelectors,
  tippingActions,
  SupportersMapForUser,
  UserListSagaFactory,
  SupporterResponse,
  topSupportersUserListSelectors,
  topSupportersUserListActions,
  TOP_SUPPORTERS_USER_LIST_TAG,
  responseAdapter as adapter
} from '@audius/common'
import { ID, User } from '@audius/common/models'
import { decodeHashId, removeNullable } from '@audius/common/utils'
import { put, select } from 'typed-redux-saga'

import { watchTopSupportersError } from 'common/store/user-list/top-supporters/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getTopSupportersError } = topSupportersUserListActions
const { getId, getUserList, getUserIds } = topSupportersUserListSelectors
const { setSupportersForUser } = tippingActions
const { getUser } = cacheUsersSelectors

type SupportersProcessExtraType = {
  userId: ID
  supporters: SupporterResponse[]
}

const provider = createUserListProvider<User, SupportersProcessExtraType>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: async ({ limit, offset, entityId, apiClient }) => {
    const supporters =
      (await apiClient.getSupporters({
        userId: entityId,
        limit,
        offset
      })) || []
    const users = supporters
      .sort((s1, s2) => s1.rank - s2.rank)
      .map((s) => adapter.makeUser(s.sender))
      .filter(removeNullable)
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
  processExtra: function* ({ userId, supporters }) {
    const supportersMap: SupportersMapForUser = {}
    supporters.forEach((supporter: SupporterResponse) => {
      const supporterUserId = decodeHashId(supporter.sender.id)
      if (supporterUserId) {
        supportersMap[supporterUserId] = {
          sender_id: supporterUserId,
          rank: supporter.rank,
          amount: supporter.amount
        }
      }
    })
    yield* put(
      setSupportersForUser({
        id: userId,
        supportersForUser: supportersMap
      })
    )
  }
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
