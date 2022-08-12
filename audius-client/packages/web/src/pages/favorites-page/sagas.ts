import { ID, Collection, FavoriteType, Track } from '@audius/common'
import { select, put } from 'typed-redux-saga/macro'

import { getCollection } from 'common/store/cache/collections/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import {
  trackFavoriteError,
  playlistFavoriteError
} from 'common/store/user-list/favorites/actions'
import { watchFavoriteError } from 'common/store/user-list/favorites/errorSagas'
import {
  getId,
  getUserList,
  getUserIds,
  getFavoriteType
} from 'common/store/user-list/favorites/selectors'
import { USER_LIST_TAG } from 'common/store/user-list/favorites/types'
import UserListSagaFactory from 'common/store/user-list/sagas'
import { createUserListProvider } from 'components/user-list/utils'

const getPlaylistFavorites = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_saves.map((r) => r.user_id),
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId,
    apiClient
  }) => {
    const users = await apiClient.getPlaylistFavoriteUsers({
      limit,
      offset,
      playlistId: entityId,
      currentUserId
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (collection: Collection, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < collection.save_count,
  includeCurrentUser: (p) => p.has_current_user_saved
})

const getTrackFavorites = createUserListProvider<Track>({
  getExistingEntity: getTrack,
  extractUserIDSubsetFromEntity: (track: Track) =>
    track.followee_saves.map((r) => r.user_id),
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId,
    apiClient
  }) => {
    const users = await apiClient.getTrackFavoriteUsers({
      limit,
      offset,
      trackId: entityId,
      currentUserId
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (track: Track, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < track.save_count,
  includeCurrentUser: (t) => t.has_current_user_saved
})

function* errorDispatcher(error: Error) {
  const favoriteType = yield* select(getFavoriteType)
  const id = yield* select(getId)
  if (!id) return

  if (favoriteType === FavoriteType.TRACK) {
    yield* put(trackFavoriteError(id, error.message))
  } else {
    yield* put(playlistFavoriteError(id, error.message))
  }
}

function* getFavorites(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  const favoriteType = yield* select(getFavoriteType)
  return yield* (
    favoriteType === FavoriteType.TRACK
      ? getTrackFavorites
      : getPlaylistFavorites
  )({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getFavorites,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFavoriteError]
}
