import {
  userMetadataFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { ID } from '@audius/common/models'
import {
  accountSelectors,
  UserListSagaFactory,
  relatedArtistsUserListActions,
  relatedArtistsUserListSelectors,
  RELATED_ARTISTS_USER_LIST_TAG,
  getSDK
} from '@audius/common/store'
import { Id, OptionalId } from '@audius/sdk'
import { call, put, select } from 'typed-redux-saga'

import { watchRelatedArtistsError } from './errorSagas'

const MAX_RELATED_ARTISTS = 50

const { getRelatedArtistsError } = relatedArtistsUserListActions
const { getId, getUserList } = relatedArtistsUserListSelectors

type FetchRelatedArtistsArgs = {
  artistId: ID
  currentPage: number
  pageSize: number
}

function* fetchRelatedArtists({
  artistId,
  currentPage,
  pageSize
}: FetchRelatedArtistsArgs) {
  const offset = currentPage * pageSize
  const sdk = yield* getSDK()
  const currentUserId = yield* select(accountSelectors.getUserId)

  const { data } = yield* call(
    [sdk.full.users, sdk.full.users.getRelatedUsers],
    {
      id: Id.parse(artistId),
      limit: MAX_RELATED_ARTISTS,
      offset,
      userId: OptionalId.parse(currentUserId)
    }
  )
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
    yield* put(getRelatedArtistsError(id, error.message))
  }
}

function* getRelatedArtists(currentPage: number, pageSize: number) {
  const id = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }

  return yield* call(fetchRelatedArtists, {
    artistId: id,
    currentPage,
    pageSize
  })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: RELATED_ARTISTS_USER_LIST_TAG,
  fetchUsers: getRelatedArtists,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchRelatedArtistsError]
}
