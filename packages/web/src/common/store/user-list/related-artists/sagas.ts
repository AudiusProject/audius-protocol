import {
  UserListSagaFactory,
  relatedArtistsUserListSelectors,
  relatedArtistsUserListActions,
  RELATED_ARTISTS_USER_LIST_TAG,
  getContext
} from '@audius/common'
import { ID } from '@audius/common/models'
import { call, put, select } from 'typed-redux-saga'

import { watchRelatedArtistsError } from './errorSagas'

export const MAX_RELATED_ARTISTS = 50

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
  const apiClient = yield* getContext('apiClient')
  const response = yield* call([apiClient, apiClient.getRelatedArtists], {
    userId: artistId,
    limit: MAX_RELATED_ARTISTS,
    offset
  })

  const users = response || []
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
