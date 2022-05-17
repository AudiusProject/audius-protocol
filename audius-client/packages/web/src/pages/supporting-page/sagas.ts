import { put, select } from 'redux-saga/effects'

import { ID } from 'common/models/Identifiers'
import { User, UserMetadata } from 'common/models/User'
import { getUser } from 'common/store/cache/users/selectors'
import UserListSagaFactory from 'common/store/user-list/sagas'
import { getSupportingError } from 'common/store/user-list/supporting/actions'
import { watchSupportingError } from 'common/store/user-list/supporting/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/user-list/supporting/selectors'
import { stringWeiToBN } from 'common/utils/wallet'
import { createUserListProvider } from 'components/user-list/utils'
import * as adapter from 'services/audius-api-client/ResponseAdapter'
import { fetchSupporting } from 'services/audius-backend/Tipping'
import { encodeHashId } from 'utils/route/hashIds'

export const USER_LIST_TAG = 'SUPPORTING'

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId
  }: {
    limit: number
    offset: number
    entityId: ID
    currentUserId: ID | null
  }) => {
    const encodedUserId = encodeHashId(entityId)
    if (!encodedUserId) return []

    const supporting = await fetchSupporting({
      encodedUserId,
      limit: limit,
      offset: offset
    })
    return supporting
      .sort((s1, s2) => {
        const amount1BN = stringWeiToBN(s1.amount)
        const amount2BN = stringWeiToBN(s2.amount)
        return amount1BN.gte(amount2BN) ? -1 : 1
      })
      .map(s => adapter.makeUser(s.receiver))
      .filter((user): user is UserMetadata => !!user)
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.supporting_count,
  includeCurrentUser: u => false
})

function* errorDispatcher(error: Error) {
  const id = yield select(getId)
  yield put(getSupportingError(id, error.message))
}

function* getSupporting(currentPage: number, pageSize: number) {
  const id: number | null = yield select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getSupporting,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchSupportingError]
}
