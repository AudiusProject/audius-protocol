import {
  userMetadataFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Id, ID, OptionalId } from '@audius/common/models'
import {
  accountSelectors,
  UserListSagaFactory,
  remixersUserListActions,
  remixersUserListSelectors,
  REMIXERS_USER_LIST_TAG,
  getSDK
} from '@audius/common/store'
import { call, put, select } from 'typed-redux-saga'

import { watchRemixersError } from './errorSagas'

const MAX_REMIXERS = 50

const { getRemixersError } = remixersUserListActions
const { getId, getUserList, getTrackId } = remixersUserListSelectors

type FetchRemixersArgs = {
  id: ID
  trackId?: ID
  currentPage: number
  pageSize: number
}

function* fetchRemixers({
  id,
  trackId,
  currentPage,
  pageSize
}: FetchRemixersArgs) {
  const offset = currentPage * pageSize
  const sdk = yield* getSDK()
  const currentUserId = yield* select(accountSelectors.getUserId)

  const { data } = yield* call([sdk.full.users, sdk.full.users.getRemixers], {
    id: Id.parse(id),
    limit: MAX_REMIXERS,
    offset,
    userId: OptionalId.parse(currentUserId),
    trackId: OptionalId.parse(trackId?.toString())
  })

  const users = transformAndCleanList(data, userMetadataFromSDK)

  const userIds = users.map((user) => user.user_id)
  return {
    userIds,
    hasMore: false
  }
}

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getRemixersError(id, error.message))
  }
}

function* getRemixers(currentPage: number, pageSize: number) {
  const id = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }

  const trackId = yield* select(getTrackId)

  return yield* call(fetchRemixers, {
    id,
    trackId,
    currentPage,
    pageSize
  })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: REMIXERS_USER_LIST_TAG,
  fetchUsers: getRemixers,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchRemixersError]
}
