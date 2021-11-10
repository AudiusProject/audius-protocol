import { select, put } from 'redux-saga/effects'

import { Collection } from 'common/models/Collection'
import { FavoriteType } from 'common/models/Favorite'
import { ID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import UserListSagaFactory from 'containers/user-list/store/sagas'
import { createUserListProvider } from 'containers/user-list/utils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

import { USER_LIST_TAG } from '../FavoritesPage'

import { trackFavoriteError, playlistFavoriteError } from './actions'
import { watchFavoriteError } from './errorSagas'
import { getId, getUserList, getUserIds, getFavoriteType } from './selectors'

const getPlaylistFavorites = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_saves.map(r => r.user_id),
  fetchAllUsersForEntity: ({ limit, offset, entityId, currentUserId }) =>
    apiClient.getPlaylistFavoriteUsers({
      limit,
      offset,
      playlistId: entityId,
      currentUserId
    }),
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (collection: Collection, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < collection.save_count,
  includeCurrentUser: p => p.has_current_user_saved
})

const getTrackFavorites = createUserListProvider<Track>({
  getExistingEntity: getTrack,
  extractUserIDSubsetFromEntity: (track: Track) =>
    track.followee_saves.map(r => r.user_id),
  fetchAllUsersForEntity: ({ limit, offset, entityId, currentUserId }) =>
    apiClient.getTrackFavoriteUsers({
      limit,
      offset,
      trackId: entityId,
      currentUserId
    }),
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (track: Track, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < track.save_count,
  includeCurrentUser: t => t.has_current_user_saved
})

function* errorDispatcher(error: Error) {
  const favoriteType = yield select(getFavoriteType)
  const id = yield select(getId)
  if (favoriteType === FavoriteType.TRACK) {
    yield put(trackFavoriteError(id, error.message))
  } else {
    yield put(playlistFavoriteError(id, error.message))
  }
}

function* getFavorites(currentPage: number, pageSize: number) {
  const id: number | null = yield select(getId)
  if (!id) return { userIds: [], hasMore: false }
  const favoriteType = yield select(getFavoriteType)
  return yield (favoriteType === FavoriteType.TRACK
    ? getTrackFavorites
    : getPlaylistFavorites)({ id, currentPage, pageSize })
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
