import { userMetadataListFromSDK } from '@audius/common/adapters'
import {
  DefaultSizes,
  Kind,
  OptionalId,
  User,
  UserMetadata
} from '@audius/common/models'
import {
  Metadata,
  accountSelectors,
  cacheActions,
  cacheUsersActions as userActions,
  cacheReducer,
  cacheUsersSelectors,
  getContext,
  reformatUser,
  getSDK
} from '@audius/common/store'
import { waitForAccount, waitForValue } from '@audius/common/utils'
import { mergeWith } from 'lodash'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { retrieveCollections } from 'common/store/cache/collections/utils'
import { retrieve } from 'common/store/cache/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { pruneBlobValues } from './utils'
const { mergeCustomizer } = cacheReducer
const { getUser, getUsers, getUserTimestamps } = cacheUsersSelectors
const { getUserId } = accountSelectors

/**
 * @param {Nullable<Array<number>>} userIds array of user ids to fetch
 * @param {Set<any>} requiredFields
 * @param {boolean} forceRetrieveFromSource
 */
export function* fetchUsers(
  userIds: number[],
  requiredFields?: Set<string>,
  forceRetrieveFromSource?: boolean
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  return yield* call(retrieve<User>, {
    ids: userIds,
    selectFromCache: function* (ids) {
      return yield* select(getUsers, { ids: ids as number[] })
    },
    getEntriesTimestamp: function* (ids) {
      return yield* select(getUserTimestamps, { ids: ids as number[] })
    },
    retrieveFromSource: (ids: (number | string)[]) =>
      audiusBackendInstance.getCreators(ids as number[]),
    kind: Kind.USERS,
    idField: 'user_id',
    requiredFields,
    forceRetrieveFromSource
  })
}

function* retrieveUserByHandle(handle: string, retry: boolean) {
  yield* waitForRead()
  const sdk = yield* getSDK()
  const userId = yield* select(getUserId)
  if (Array.isArray(handle)) {
    handle = handle[0]
  }

  const { data: users = [] } = yield* call(
    [sdk.full.users, sdk.full.users.getUserByHandle],
    {
      handle,
      userId: OptionalId.parse(userId)
    }
  )
  return userMetadataListFromSDK(users)
}

export function* fetchUserByHandle(
  handle: string,
  requiredFields?: Set<string>,
  forceRetrieveFromSource = false,
  shouldSetLoading = true,
  deleteExistingEntry = false,
  retry = true
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  // We only need to handle 1 handle
  const retrieveFromSource = function* (handles: (string | number)[]) {
    return yield* retrieveUserByHandle(handles[0].toString(), retry)
  }

  const { entries: users } = yield* call(retrieve<UserMetadata>, {
    ids: [handle],
    selectFromCache: function* (handles) {
      return yield* select(getUsers, { handles: handles as string[] })
    },
    getEntriesTimestamp: function* (handles) {
      return yield* select(getUserTimestamps, {
        handles: handles.map(toString)
      })
    },
    retrieveFromSource,
    onBeforeAddToCache: function* (users: Metadata[]) {
      return users.map((user) =>
        reformatUser(user as User, audiusBackendInstance)
      )
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
export function* fetchUserCollections(userId: number) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  // Get playlists.
  const playlists = yield* call(
    audiusBackendInstance.getPlaylists,
    userId,
    null
  )
  const playlistIds = playlists.map((p) => p.playlist_id)

  if (!playlistIds.length) {
    yield* put(
      cacheActions.update(Kind.USERS, [
        {
          id: userId,
          metadata: { _collectionIds: [] }
        }
      ])
    )
  }
  const { collections } = yield* call(retrieveCollections, playlistIds, {
    userId
  })
  const cachedCollectionIds = Object.values(collections).map(
    (c) => c.playlist_id
  )

  yield* put(
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
  const localStorage = yield* getContext('localStorage')
  function* syncLocalStorageUser(
    action: ReturnType<
      typeof cacheActions.update | typeof cacheActions.addSucceeded
    >
  ) {
    yield* waitForAccount()
    const currentUserId = yield* select(getUserId)
    if (!currentUserId) return
    if (
      action.kind === Kind.USERS &&
      action.entries[0] &&
      action.entries[0].id === currentUserId
    ) {
      const addedUser = action.entries[0].metadata
      // Get existing locally stored user
      const existing = yield* call([localStorage, 'getAudiusAccountUser'])
      // Merge with the new metadata
      const merged = mergeWith({}, existing, addedUser, mergeCustomizer)
      // Remove blob urls if any - blob urls only last for the session so we don't want to store those
      const cleaned = pruneBlobValues(merged)

      // Set user back to local storage
      yield* call([localStorage, 'setAudiusAccountUser'], cleaned)
    }
  }
  yield* takeEvery(cacheActions.ADD_SUCCEEDED, syncLocalStorageUser)
  yield* takeEvery(cacheActions.UPDATE, syncLocalStorageUser)
}

// Adjusts a user's field in the cache by specifying an update as a delta.
// The cache respects the delta and merges the objects adding the field values
export function* adjustUserField({
  user,
  fieldName,
  delta
}: {
  user: User
  fieldName: string
  delta: any
}) {
  yield* put(
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
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const inProgress = new Set()
  yield* takeEvery(
    userActions.FETCH_PROFILE_PICTURE,
    function* ({
      userId,
      size
    }: ReturnType<typeof userActions.fetchProfilePicture>) {
      // Unique on id and size
      const key = `${userId}-${size}`
      if (inProgress.has(key)) return
      inProgress.add(key)

      try {
        const user: User | null = yield* select(getUser, { id: userId })
        if (!user || (!user.profile_picture_sizes && !user.profile_picture))
          return
        if (user.profile_picture_sizes) {
          const url = yield* call(
            audiusBackendInstance.getImageUrl,
            user.profile_picture_sizes,
            size,
            user.profile_picture_cids
          )

          if (url) {
            yield* put(
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
          const url = yield* call(
            audiusBackendInstance.getImageUrl,
            user.profile_picture
          )
          if (url) {
            yield* put(
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
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const inProgress = new Set()
  yield* takeEvery(
    userActions.FETCH_COVER_PHOTO,
    function* ({
      userId,
      size
    }: ReturnType<typeof userActions.fetchCoverPhoto>) {
      // Unique on id and size
      const key = `${userId}-${size}`
      if (inProgress.has(key)) return
      inProgress.add(key)
      try {
        let user: User | null = yield* select(getUser, { id: userId })
        if (!user || (!user.cover_photo_sizes && !user.cover_photo)) {
          inProgress.delete(key)
          return
        }

        if (user.cover_photo_sizes) {
          const url = yield* call(
            audiusBackendInstance.getImageUrl,
            user.cover_photo_sizes,
            size,
            user.cover_photo_cids
          )

          if (url) {
            user = yield* select(getUser, { id: userId })
            if (!user) return
            user._cover_photo_sizes = {
              ...user._cover_photo_sizes,
              [size]: url
            }
            yield* put(
              cacheActions.update(Kind.USERS, [{ id: userId, metadata: user }])
            )
          }
        } else if (user.cover_photo) {
          const url = yield* call(
            audiusBackendInstance.getImageUrl,
            user.cover_photo
          )
          if (url) {
            user = yield* select(getUser, { id: userId })
            if (!user) return
            user._cover_photo_sizes = {
              ...user._cover_photo_sizes,
              [DefaultSizes.OVERRIDE]: url
            }
            yield* put(
              cacheActions.update(Kind.USERS, [{ id: userId, metadata: user }])
            )
          }
        }
      } catch (e) {
        console.error(`Unable to fetch cover photo for user ${userId}`)
      } finally {
        inProgress.delete(key)
      }
    }
  )
}

export function* fetchUserSocials({
  handle
}: ReturnType<typeof userActions.fetchUserSocials>) {
  let user = yield* select(getUser, { handle })
  if (!user && handle) {
    yield* call(fetchUserByHandle, handle, new Set())
  }
  user = yield* call(waitForValue, getUser, { handle })
  if (!user) return

  yield* put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          twitter_handle: user.twitter_handle || null,
          instagram_handle: user.instagram_handle || null,
          tiktok_handle: user.tiktok_handle || null,
          website: user.website || null,
          donation: user.donation || null
        }
      }
    ])
  )
}

function* watchFetchUserSocials() {
  yield* takeEvery(userActions.FETCH_USER_SOCIALS, fetchUserSocials)
}

function* watchFetchUsers() {
  yield* takeEvery(
    userActions.FETCH_USERS,
    function* (action: ReturnType<typeof userActions.fetchUsers>) {
      const { userIds, requiredFields, forceRetrieveFromSource } =
        action.payload
      yield* call(fetchUsers, userIds, requiredFields, forceRetrieveFromSource)
    }
  )
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
