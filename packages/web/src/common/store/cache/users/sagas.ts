import { userMetadataListFromSDK } from '@audius/common/adapters'
import { Kind, User, UserMetadata } from '@audius/common/models'
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
import { Id, OptionalId } from '@audius/sdk'
import { mergeWith } from 'lodash'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { retrieve } from 'common/store/cache/sagas'
import { waitForRead } from 'utils/sagaHelpers'

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
  const sdk = yield* getSDK()
  const userId = yield* select(getUserId)

  return yield* call(retrieve<UserMetadata>, {
    ids: userIds,
    selectFromCache: function* (ids) {
      return yield* select(getUsers, { ids: ids as number[] })
    },
    getEntriesTimestamp: function* (ids) {
      return yield* select(getUserTimestamps, { ids: ids as number[] })
    },
    retrieveFromSource: function* (ids: (number | string)[]) {
      const { data } = yield* call(
        [sdk.full.users, sdk.full.users.getBulkUsers],
        {
          id: ids.map((id) => Id.parse(id)),
          userId: OptionalId.parse(userId)
        }
      )
      return userMetadataListFromSDK(data)
    },
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
      return users.map((user) => reformatUser(user as User))
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

      // Set user back to local storage
      yield* call([localStorage, 'setAudiusAccountUser'], merged)
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
  return [watchSyncLocalStorageUser, watchFetchUserSocials, watchFetchUsers]
}

export default sagas
