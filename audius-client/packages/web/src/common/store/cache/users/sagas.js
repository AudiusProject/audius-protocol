import { mergeWith } from 'lodash'
import { call, put, select, take, takeEvery, race } from 'redux-saga/effects'

import { DefaultSizes } from 'common/models/ImageSizes'
import Kind from 'common/models/Kind'
import Status from 'common/models/Status'
import { getAccountUser, getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { mergeCustomizer } from 'common/store/cache/reducer'
import { retrieve } from 'common/store/cache/sagas'
import * as userActions from 'common/store/cache/users/actions'
import {
  getUser,
  getUsers,
  getUserTimestamps
} from 'common/store/cache/users/selectors'
import {
  getSelectedServices,
  getStatus
} from 'containers/service-selection/store/selectors'
import { fetchServicesFailed } from 'containers/service-selection/store/slice'
import AudiusBackend from 'services/AudiusBackend'
import {
  getAudiusAccountUser,
  setAudiusAccountUser
} from 'services/LocalStorage'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { averageRgb } from 'utils/imageProcessingUtil'
import { waitForValue } from 'utils/sagaHelpers'

import { pruneBlobValues, reformat } from './utils'

/**
 * If the user is not a creator, upgrade the user to a creator node.
 */
export function* upgradeToCreator() {
  const user = yield select(getAccountUser)

  // If user already has creator_node_endpoint, do not reselect replica set
  let newEndpoint = user.creator_node_endpoint || ''
  if (!newEndpoint) {
    const serviceSelectionStatus = yield select(getStatus)
    if (serviceSelectionStatus === Status.ERROR) {
      return false
    }
    // Wait for service selection to finish
    const { selectedServices } = yield race({
      selectedServices: call(
        waitForValue,
        getSelectedServices,
        {},
        val => val.length > 0
      ),
      failure: take(fetchServicesFailed.type)
    })
    if (!selectedServices) {
      return false
    }
    newEndpoint = selectedServices.join(',')

    // Try to upgrade to creator, early return if failure
    try {
      console.debug(`Attempting to upgrade user ${user.user_id} to creator`)
      yield call(AudiusBackend.upgradeToCreator, newEndpoint)
    } catch (err) {
      console.error(`Upgrade to creator failed with error: ${err}`)
      return false
    }
  }
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          creator_node_endpoint: newEndpoint,
          is_creator: true
        }
      }
    ])
  )
  return true
}

/**
 * @param {Array<number>} userIds array of user ids to fetch
 */
export function* fetchUsers(
  userIds,
  requiredFields = new Set(),
  forceRetrieveFromSource = false
) {
  return yield call(retrieve, {
    ids: userIds,
    selectFromCache: function* (ids) {
      return yield select(getUsers, { ids })
    },
    getEntriesTimestamp: function* (ids) {
      return yield select(getUserTimestamps, { ids })
    },
    retrieveFromSource: AudiusBackend.getCreators,
    kind: Kind.USERS,
    idField: 'user_id',
    requiredFields,
    forceRetrieveFromSource
  })
}

function* retrieveUserByHandle(handle) {
  const userId = yield select(getUserId)
  if (Array.isArray(handle)) {
    handle = handle[0]
  }
  const user = yield apiClient.getUserByHandle({
    handle,
    currentUserId: userId
  })
  return user
}

export function* fetchUserByHandle(
  handle,
  requiredFields,
  forceRetrieveFromSource = false,
  shouldSetLoading = true,
  deleteExistingEntry = false
) {
  const { entries: users } = yield call(retrieve, {
    ids: [handle],
    selectFromCache: function* (handles) {
      return yield select(getUsers, { handles })
    },
    getEntriesTimestamp: function* (handles) {
      return yield select(getUserTimestamps, { handles })
    },
    retrieveFromSource: retrieveUserByHandle,
    onBeforeAddToCache: function (users) {
      return users.map(reformat)
    },
    kind: Kind.USERS,
    idField: 'user_id',
    requiredFields,
    forceRetrieveFromSource,
    shouldSetLoading,
    deleteExistingEntry
  })
  return users[handle]
}

/**
 * @param {number} userId target user id
 */
export function* fetchUserCollections(userId) {
  // Get playlists.
  const playlists = yield call(AudiusBackend.getPlaylists, userId)
  const playlistIds = playlists.map(p => p.playlist_id)

  if (!playlistIds.length) return
  const { collections } = yield call(retrieveCollections, userId, playlistIds)
  const cachedCollectionIds = Object.values(collections).map(c => c.playlist_id)

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: { _collectionIds: cachedCollectionIds }
      }
    ])
  )
}

function* watchAdd() {
  yield takeEvery(cacheActions.ADD_SUCCEEDED, function* (action) {
    if (action.kind === Kind.USERS) {
      yield put(
        userActions.setHandleStatus(
          action.entries
            .filter(entry => !!entry.metadata.handle)
            .map(entry => ({
              handle: entry.metadata.handle,
              id: entry.id,
              status: Status.SUCCESS
            }))
        )
      )
    }
  })
}

// For updates and adds, sync the account user to local storage.
// We use the same mergeCustomizer we use in cacheSagas to merge
// with the local state.
function* watchSyncLocalStorageUser() {
  function* syncLocalStorageUser(action) {
    const currentUser = yield select(getAccountUser)
    if (!currentUser) return
    const currentId = currentUser.user_id
    if (
      action.kind === Kind.USERS &&
      action.entries[0] &&
      action.entries[0].id === currentId
    ) {
      const addedUser = action.entries[0].metadata
      // Get existing locally stored user
      const existing = getAudiusAccountUser()
      // Merge with the new metadata
      const merged = mergeWith({}, existing, addedUser, mergeCustomizer)
      // Remove blob urls if any
      // Blob urls only last for the session so we don't want to store those
      const cleaned = pruneBlobValues(merged)
      // Set user back to local storage
      setAudiusAccountUser(cleaned)
    }
  }
  yield takeEvery(cacheActions.ADD_SUCCEEDED, syncLocalStorageUser)
  yield takeEvery(cacheActions.UPDATE, syncLocalStorageUser)
}

// Adjusts a user's field in the cache by specifying an update as a delta.
// The cache respects the delta and merges the objects adding the field values
export function* adjustUserField({ user, fieldName, delta }) {
  yield put(
    cacheActions.increment(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          [fieldName]: delta
        }
      }
    ])
  )
}

function* watchFetchProfilePicture() {
  const inProgress = new Set()
  yield takeEvery(userActions.FETCH_PROFILE_PICTURE, function* ({
    userId,
    size
  }) {
    // Unique on id and size
    const key = `${userId}-${size}`
    if (inProgress.has(key)) return
    inProgress.add(key)

    try {
      let user = yield select(getUser, { id: userId })
      if (!user || (!user.profile_picture_sizes && !user.profile_picture))
        return
      const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
      if (user.profile_picture_sizes) {
        const url = yield call(
          AudiusBackend.getImageUrl,
          user.profile_picture_sizes,
          size,
          gateways
        )
        if (url) {
          user = yield select(getUser, { id: userId })
          user._profile_picture_sizes = {
            ...user._profile_picture_sizes,
            [size]: url
          }
          yield put(
            cacheActions.update(Kind.USERS, [{ id: userId, metadata: user }])
          )

          const rgb = yield call(averageRgb, url)
          yield put(
            cacheActions.update(Kind.USERS, [
              { id: userId, metadata: { _profile_picture_color: rgb } }
            ])
          )
        }
      } else if (user.profile_picture) {
        const url = yield call(
          AudiusBackend.getImageUrl,
          user.profile_picture,
          null,
          gateways
        )
        if (url) {
          user = yield select(getUser, { id: userId })
          user._profile_picture_sizes = {
            ...user._profile_picture_sizes,
            [DefaultSizes.OVERRIDE]: url
          }
          yield put(
            cacheActions.update(Kind.USERS, [{ id: userId, metadata: user }])
          )
          const rgb = yield call(averageRgb, url)
          yield put(
            cacheActions.update(Kind.USERS, [
              { id: userId, metadata: { _profile_picture_color: rgb } }
            ])
          )
        }
      }
    } catch (e) {
      console.error(`Unable to fetch profile picture for user ${userId}`)
    } finally {
      inProgress.delete(key)
    }
  })
}

function* watchFetchCoverPhoto() {
  const inProgress = new Set()
  yield takeEvery(userActions.FETCH_COVER_PHOTO, function* ({ userId, size }) {
    // Unique on id and size
    const key = `${userId}-${size}`
    if (inProgress.has(key)) return
    inProgress.add(key)
    try {
      let user = yield select(getUser, { id: userId })
      if (!user || (!user.cover_photo_sizes && !user.cover_photo)) {
        inProgress.delete(key)
        return
      }

      const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
      if (user.cover_photo_sizes) {
        const url = yield call(
          AudiusBackend.getImageUrl,
          user.cover_photo_sizes,
          size,
          gateways
        )

        if (url) {
          user = yield select(getUser, { id: userId })
          user._cover_photo_sizes = {
            ...user._cover_photo_sizes,
            [size]: url
          }
          yield put(
            cacheActions.update(Kind.USERS, [{ id: userId, metadata: user }])
          )
        }
      } else if (user.cover_photo) {
        const url = yield call(
          AudiusBackend.getImageUrl,
          user.cover_photo,
          null,
          gateways
        )
        if (url) {
          user = yield select(getUser, { id: userId })
          user._cover_photo_sizes = {
            ...user._cover_photo_sizes,
            [DefaultSizes.OVERRIDE]: url
          }
          yield put(
            cacheActions.update(Kind.USERS, [{ id: userId, metadata: user }])
          )
        }
      }
    } catch (e) {
      console.error(`Unable to fetch cover photo for user ${userId}`)
    } finally {
      inProgress.delete(key)
    }
  })
}

const sagas = () => {
  return [
    watchAdd,
    watchFetchProfilePicture,
    watchFetchCoverPhoto,
    watchSyncLocalStorageUser
  ]
}

export default sagas
