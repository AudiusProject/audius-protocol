import {
  DefaultSizes,
  Kind,
  accountSelectors,
  cacheActions,
  cacheUsersSelectors,
  cacheReducer,
  cacheUsersActions as userActions,
  waitForValue,
  waitForAccount,
  reformatUser
} from '@audius/common'
import { mergeWith } from 'lodash'
import { call, put, select, takeEvery, getContext } from 'redux-saga/effects'

import { retrieveCollections } from 'common/store/cache/collections/utils'
import { retrieve } from 'common/store/cache/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { pruneBlobValues } from './utils'
const { mergeCustomizer } = cacheReducer
const { getUser, getUsers, getUserTimestamps } = cacheUsersSelectors
const { getAccountUser, getUserId } = accountSelectors

/**
 * @param {Nullable<Array<number>>} userIds array of user ids to fetch
 * @param {Set<any>} requiredFields
 * @param {boolean} forceRetrieveFromSource
 */
export function* fetchUsers(
  userIds,
  requiredFields = new Set(),
  forceRetrieveFromSource = false
) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  return yield call(retrieve, {
    ids: userIds,
    selectFromCache: function* (ids) {
      return yield select(getUsers, { ids })
    },
    getEntriesTimestamp: function* (ids) {
      return yield select(getUserTimestamps, { ids })
    },
    retrieveFromSource: audiusBackendInstance.getCreators,
    kind: Kind.USERS,
    idField: 'user_id',
    requiredFields,
    forceRetrieveFromSource
  })
}

function* retrieveUserByHandle(handle, retry) {
  yield waitForRead()
  const apiClient = yield getContext('apiClient')
  const userId = yield select(getUserId)
  if (Array.isArray(handle)) {
    handle = handle[0]
  }
  const user = yield apiClient.getUserByHandle({
    handle,
    currentUserId: userId,
    retry
  })
  return user
}

export function* fetchUserByHandle(
  handle,
  requiredFields,
  forceRetrieveFromSource = false,
  shouldSetLoading = true,
  deleteExistingEntry = false,
  retry = true
) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const retrieveFromSource = (handle) => retrieveUserByHandle(handle, retry)
  const { entries: users } = yield call(retrieve, {
    ids: [handle],
    selectFromCache: function* (handles) {
      return yield select(getUsers, { handles })
    },
    getEntriesTimestamp: function* (handles) {
      return yield select(getUserTimestamps, { handles })
    },
    retrieveFromSource,
    onBeforeAddToCache: function (users) {
      return users.map((user) => reformatUser(user, audiusBackendInstance))
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
 * @deprecated legacy method for web
 * @param {number} userId target user id
 */
export function* fetchUserCollections(userId) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  // Get playlists.
  const playlists = yield call(audiusBackendInstance.getPlaylists, userId)
  const playlistIds = playlists.map((p) => p.playlist_id)

  if (!playlistIds.length) {
    yield put(
      cacheActions.update(Kind.USERS, [
        {
          id: userId,
          metadata: { _collectionIds: [] }
        }
      ])
    )
  }
  const { collections } = yield call(retrieveCollections, playlistIds, {
    userId
  })
  const cachedCollectionIds = Object.values(collections).map(
    (c) => c.playlist_id
  )

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: { _collectionIds: cachedCollectionIds }
      }
    ])
  )
}

// For updates and adds, sync the account user to local storage.
// We use the same mergeCustomizer we use in cacheSagas to merge
// with the local state.
function* watchSyncLocalStorageUser() {
  const localStorage = yield getContext('localStorage')
  function* syncLocalStorageUser(action) {
    yield waitForAccount()
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
      const existing = yield call([localStorage, 'getAudiusAccountUser'])
      // Merge with the new metadata
      const merged = mergeWith({}, existing, addedUser, mergeCustomizer)
      // Remove blob urls if any - blob urls only last for the session so we don't want to store those
      const cleaned = pruneBlobValues(merged)

      // Set user back to local storage
      yield call([localStorage, 'setAudiusAccountUser'], cleaned)
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
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const inProgress = new Set()
  yield takeEvery(
    userActions.FETCH_PROFILE_PICTURE,
    function* ({ userId, size }) {
      // Unique on id and size
      const key = `${userId}-${size}`
      if (inProgress.has(key)) return
      inProgress.add(key)

      try {
        const user = yield select(getUser, { id: userId })
        if (!user || (!user.profile_picture_sizes && !user.profile_picture))
          return
        if (user.profile_picture_sizes) {
          const url = yield call(
            audiusBackendInstance.getImageUrl,
            user.profile_picture_sizes,
            size,
            user.profile_picture_cids
          )

          if (url) {
            yield put(
              cacheActions.update(Kind.USERS, [
                {
                  id: userId,
                  metadata: {
                    _profile_picture_sizes: {
                      ...user._profile_picture_sizes,
                      [size]: url
                    }
                  }
                }
              ])
            )
          }
        } else if (user.profile_picture) {
          const url = yield call(
            audiusBackendInstance.getImageUrl,
            user.profile_picture
          )
          if (url) {
            yield put(
              cacheActions.update(Kind.USERS, [
                {
                  id: userId,
                  metadata: {
                    _profile_picture_sizes: {
                      ...user._profile_picture_sizes,
                      [DefaultSizes.OVERRIDE]: url
                    }
                  }
                }
              ])
            )
          }
        }
      } catch (e) {
        console.error(`Unable to fetch profile picture for user ${userId}`)
      } finally {
        inProgress.delete(key)
      }
    }
  )
}

function* watchFetchCoverPhoto() {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
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

      if (user.cover_photo_sizes) {
        const url = yield call(
          audiusBackendInstance.getImageUrl,
          user.cover_photo_sizes,
          size,
          user.cover_photo_cids
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
          audiusBackendInstance.getImageUrl,
          user.cover_photo
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

export function* fetchUserSocials({ handle }) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  let user = yield select(getUser, { handle })
  if (!user) {
    yield call(fetchUserByHandle, handle)
  }
  user = yield call(waitForValue, getUser, { handle })
  const socials = yield call(
    audiusBackendInstance.getSocialHandles,
    user.handle
  )

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          twitter_handle: socials.twitterHandle || null,
          instagram_handle: socials.instagramHandle || null,
          tiktok_handle: socials.tikTokHandle || null,
          website: socials.website || null,
          donation: socials.donation || null
        }
      }
    ])
  )
}

function* watchFetchUserSocials() {
  yield takeEvery(userActions.FETCH_USER_SOCIALS, fetchUserSocials)
}

function* watchFetchUsers() {
  yield takeEvery(userActions.FETCH_USERS, function* (action) {
    const { userIds, requiredFields, forceRetrieveFromSource } = action.payload
    yield call(fetchUsers, userIds, requiredFields, forceRetrieveFromSource)
  })
}

const sagas = () => {
  return [
    watchFetchProfilePicture,
    watchFetchCoverPhoto,
    watchSyncLocalStorageUser,
    watchFetchUserSocials,
    watchFetchUsers
  ]
}

export default sagas
