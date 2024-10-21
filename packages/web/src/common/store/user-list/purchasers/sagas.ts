import {
  userMetadataFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Id, ID, OptionalId } from '@audius/common/models'
import {
  accountSelectors,
  UserListSagaFactory,
  purchasersUserListActions,
  purchasersUserListSelectors,
  PURCHASERS_USER_LIST_TAG,
  getSDK,
  PurchaseableContentType
} from '@audius/common/store'
import { call, put, select } from 'typed-redux-saga'

import { watchPurchasersError } from './errorSagas'

export const MAX_PURCHASERS = 50

const { getPurchasersError } = purchasersUserListActions
const { getId, getUserList, getContentId, getContentType } =
  purchasersUserListSelectors

type FetchPurchasersArgs = {
  id: ID
  contentId?: ID
  contentType?: PurchaseableContentType
  currentPage: number
  pageSize: number
}

function* fetchPurchasers({
  id,
  contentId,
  contentType,
  currentPage,
  pageSize
}: FetchPurchasersArgs) {
  const offset = currentPage * pageSize
  const sdk = yield* getSDK()
  const currentUserId = yield* select(accountSelectors.getUserId)

  const { data } = yield* call([sdk.full.users, sdk.full.users.getPurchasers], {
    id: Id.parse(id),
    limit: MAX_PURCHASERS,
    offset,
    userId: OptionalId.parse(currentUserId),
    contentType,
    contentId: contentId?.toString()
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
    yield* put(getPurchasersError(id, error.message))
  }
}

function* getPurchasers(currentPage: number, pageSize: number) {
  const id = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }

  const contentType = yield* select(getContentType)
  const contentId = yield* select(getContentId)

  return yield* call(fetchPurchasers, {
    id,
    contentId,
    contentType,
    currentPage,
    pageSize
  })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: PURCHASERS_USER_LIST_TAG,
  fetchUsers: getPurchasers,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchPurchasersError]
}
