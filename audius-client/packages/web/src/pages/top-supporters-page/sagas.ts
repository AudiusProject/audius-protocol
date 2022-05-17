import { put, select } from 'redux-saga/effects'

import { ID } from 'common/models/Identifiers'
import { User, UserMetadata } from 'common/models/User'
import { getUser } from 'common/store/cache/users/selectors'
import UserListSagaFactory from 'common/store/user-list/sagas'
import { getTopSupportersError } from 'common/store/user-list/top-supporters/actions'
import { watchTopSupportersError } from 'common/store/user-list/top-supporters/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/user-list/top-supporters/selectors'
import { createUserListProvider } from 'components/user-list/utils'
import * as adapter from 'services/audius-api-client/ResponseAdapter'
import { fetchSupporters } from 'services/audius-backend/Tipping'
import { encodeHashId } from 'utils/route/hashIds'

export const USER_LIST_TAG = 'TOP SUPPORTERS'

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

    const supporters = await fetchSupporters({
      encodedUserId,
      limit: limit,
      offset: offset
    })
    return supporters
      .sort((s1, s2) => s1.rank - s2.rank)
      .map(s => adapter.makeUser(s.sender))
      .filter((user): user is UserMetadata => !!user)
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.supporter_count,
  includeCurrentUser: u => false
})

function* errorDispatcher(error: Error) {
  const id = yield select(getId)
  yield put(getTopSupportersError(id, error.message))
}

function* getTopSupporters(currentPage: number, pageSize: number) {
  const id: number | null = yield select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getTopSupporters,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchTopSupportersError]
}
