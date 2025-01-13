import { userMetadataListFromSDK } from '@audius/common/adapters'
import { FavoriteType, Collection, ID, Track } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  UserListSagaFactory,
  favoritesUserListActions,
  favoritesUserListSelectors,
  FAVORITES_USER_LIST_TAG,
  getSDK
} from '@audius/common/store'
import { Id, OptionalId } from '@audius/sdk'
import { select, put, call } from 'typed-redux-saga'

import { watchFavoriteError } from 'common/store/user-list/favorites/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'

const { getId, getUserList, getUserIds, getFavoriteType } =
  favoritesUserListSelectors
const { trackFavoriteError, playlistFavoriteError } = favoritesUserListActions
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors

const getPlaylistFavorites = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_saves.map((r) => r.user_id),
  fetchAllUsersForEntity: function* ({
    limit,
    offset,
    entityId,
    currentUserId
  }) {
    const sdk = yield* getSDK()

    const { data } = yield* call(
      [sdk.full.playlists, sdk.full.playlists.getUsersFromPlaylistFavorites],
      {
        limit,
        offset,
        playlistId: Id.parse(entityId),
        userId: OptionalId.parse(currentUserId)
      }
    )
    const users = userMetadataListFromSDK(data)
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
  fetchAllUsersForEntity: function* ({
    limit,
    offset,
    entityId,
    currentUserId
  }) {
    const sdk = yield* getSDK()

    const { data } = yield* call(
      [sdk.full.tracks, sdk.full.tracks.getUsersFromFavorites],
      {
        limit,
        offset,
        trackId: Id.parse(entityId),
        userId: OptionalId.parse(currentUserId)
      }
    )
    const users = userMetadataListFromSDK(data)

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
  tag: FAVORITES_USER_LIST_TAG,
  fetchUsers: getFavorites,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFavoriteError]
}
