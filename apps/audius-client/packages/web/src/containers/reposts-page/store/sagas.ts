import { put, select } from 'redux-saga/effects'

import { Collection } from 'common/models/Collection'
import { ID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import UserListSagaFactory from 'containers/user-list/store/sagas'
import { createUserListProvider } from 'containers/user-list/utils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

import { USER_LIST_TAG } from '../RepostsPage'

import { trackRepostError, playlistRepostError } from './actions'
import { watchRepostsError } from './errorSagas'
import { getId, getRepostsType, getUserList, getUserIds } from './selectors'
import { RepostType } from './types'

const getPlaylistReposts = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_reposts.map(r => r.user_id),
  fetchAllUsersForEntity: ({ limit, offset, entityId, currentUserId }) =>
    apiClient.getPlaylistRepostUsers({
      limit,
      offset,
      playlistId: entityId,
      currentUserId
    }),
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (collection: Collection, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < collection.repost_count,
  includeCurrentUser: p => p.has_current_user_reposted
})

const getTrackReposts = createUserListProvider<Track>({
  getExistingEntity: getTrack,
  extractUserIDSubsetFromEntity: (track: Track) =>
    track.followee_reposts.map(r => r.user_id),
  fetchAllUsersForEntity: ({
    limit,
    offset,
    entityId,
    currentUserId
  }: {
    limit: number
    offset: number
    entityId: ID
    currentUserId: ID | null
  }) =>
    apiClient.getTrackRepostUsers({
      limit,
      offset,
      trackId: entityId,
      currentUserId
    }),
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (track: Track, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < track.repost_count,
  includeCurrentUser: t => t.has_current_user_reposted
})

function* errorDispatcher(error: Error) {
  const repostType = yield select(getRepostsType)
  const id = yield select(getId)
  if (repostType === RepostType.TRACK) {
    yield put(trackRepostError(id, error.message))
  } else {
    yield put(playlistRepostError(id, error.message))
  }
}

function* getReposts(currentPage: number, pageSize: number) {
  const id: number | null = yield select(getId)
  if (!id) return { userIds: [], hasMore: false }
  const repostType = yield select(getRepostsType)
  return yield (repostType === RepostType.TRACK
    ? getTrackReposts
    : getPlaylistReposts)({ id, currentPage, pageSize })
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
