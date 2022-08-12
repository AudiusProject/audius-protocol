import { ID, User } from '@audius/common'
import { put, select } from 'typed-redux-saga/macro'

import { AudiusBackend } from 'common/services/audius-backend'
import { getUser } from 'common/store/cache/users/selectors'
import { getMutualsError } from 'common/store/user-list/mutuals/actions'
import { watchMutualsError } from 'common/store/user-list/mutuals/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/user-list/mutuals/selectors'
import { USER_LIST_TAG } from 'common/store/user-list/mutuals/types'
import UserListSagaFactory from 'common/store/user-list/sagas'
import { createUserListProvider } from 'components/user-list/utils'

type FetchMutualsConfig = {
  limit: number
  offset: number
  entityId: ID
  currentUserId: ID | null
  audiusBackendInstance: AudiusBackend
}

const fetchAllUsersForEntity = async ({
  limit,
  offset,
  entityId: userId,
  audiusBackendInstance
}: FetchMutualsConfig) => {
  const mutuals = await audiusBackendInstance.getFolloweeFollows(
    userId,
    limit,
    offset
  )
  return { users: mutuals }
}

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity,
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
  tag: USER_LIST_TAG,
  fetchUsers: getMutuals,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchMutualsError]
}
