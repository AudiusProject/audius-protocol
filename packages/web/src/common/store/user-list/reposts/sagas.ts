import { userMetadataListFromSDK } from '@audius/common/adapters'
import { Collection, ID, Track } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  UserListSagaFactory,
  repostsUserListActions,
  repostsUserListSelectors,
  RepostType,
  REPOSTS_USER_LIST_TAG,
  getSDK
} from '@audius/common/store'
import { Id, OptionalId } from '@audius/sdk'
import { call, put, select } from 'typed-redux-saga'

import { watchRepostsError } from 'common/store/user-list/reposts/errorSagas'
import { createUserListProvider } from 'common/store/user-list/utils'
const { getId, getRepostsType, getUserList, getUserIds } =
  repostsUserListSelectors
const { trackRepostError, playlistRepostError } = repostsUserListActions
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors

const getPlaylistReposts = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_reposts.map((r) => r.user_id),
  fetchAllUsersForEntity: function* ({
    limit,
    offset,
    entityId,
    currentUserId
  }) {
    const sdk = yield* getSDK()

    const { data } = yield* call(
      [sdk.full.playlists, sdk.full.playlists.getUsersFromPlaylistReposts],
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
    combinedUserIDs.length < collection.repost_count,
  includeCurrentUser: (p) => p.has_current_user_reposted
})

const getTrackReposts = createUserListProvider<Track>({
  getExistingEntity: getTrack,
  extractUserIDSubsetFromEntity: (track: Track) =>
    track.followee_reposts.map((r) => r.user_id),
  fetchAllUsersForEntity: function* ({
    limit,
    offset,
    entityId,
    currentUserId
  }) {
    const sdk = yield* getSDK()
    const { data } = yield* call(
      [sdk.full.tracks, sdk.full.tracks.getUsersFromReposts],
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
    combinedUserIDs.length < track.repost_count,
  includeCurrentUser: (t) => t.has_current_user_reposted
})

function* errorDispatcher(error: Error) {
  const repostType = yield* select(getRepostsType)
  const id = yield* select(getId)
  if (!id) return

  if (repostType === RepostType.TRACK) {
    yield* put(trackRepostError(id, error.message))
  } else {
    yield* put(playlistRepostError(id, error.message))
  }
}

function* getReposts(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  const repostType = yield* select(getRepostsType)
  return yield* (
    repostType === RepostType.TRACK ? getTrackReposts : getPlaylistReposts
  )({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: REPOSTS_USER_LIST_TAG,
  fetchUsers: getReposts,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchRepostsError]
}
