import { ID, Collection, Track } from '@audius/common'
import { put, select } from 'typed-redux-saga'

import { getCollection } from 'common/store/cache/collections/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import {
  trackRepostError,
  playlistRepostError
} from 'common/store/user-list/reposts/actions'
import { watchRepostsError } from 'common/store/user-list/reposts/errorSagas'
import {
  getId,
  getRepostsType,
  getUserList,
  getUserIds
} from 'common/store/user-list/reposts/selectors'
import { RepostType } from 'common/store/user-list/reposts/types'
import UserListSagaFactory from 'common/store/user-list/sagas'
import { createUserListProvider } from 'components/user-list/utils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

export const USER_LIST_TAG = 'REPOSTS'

const getPlaylistReposts = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_reposts.map((r) => r.user_id),
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId
  }) => {
    const users = await apiClient.getPlaylistRepostUsers({
      limit,
      offset,
      playlistId: entityId,
      currentUserId
    })
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
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId
  }: {
    limit: number
    offset: number
    entityId: ID
    currentUserId: ID | null
  }) => {
    const users = await apiClient.getTrackRepostUsers({
      limit,
      offset,
      trackId: entityId,
      currentUserId
    })
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
  tag: USER_LIST_TAG,
  fetchUsers: getReposts,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchRepostsError]
}
