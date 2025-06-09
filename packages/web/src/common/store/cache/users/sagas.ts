import { queryCurrentUserId, queryUserByHandle } from '@audius/common/api'
import { Kind, User } from '@audius/common/models'
import {
  cacheActions,
  cacheUsersActions as userActions,
  getContext,
  mergeCustomizer
} from '@audius/common/store'
import { waitForAccount } from '@audius/common/utils'
import { mergeWith } from 'lodash'
import { call, put, takeEvery } from 'typed-redux-saga'
import { getUserComputedPropsQueryKey } from '~/api/tan-query/users/useUser'

// For updates and adds, sync the account user to local storage.
// We use the same mergeCustomizer we use in cacheSagas to merge
// with the local state.

// TODO: replace this saga with a query client listener instead
function* watchSyncLocalStorageUser() {
  const localStorage = yield* getContext('localStorage')
  function* syncLocalStorageUser(
    action: ReturnType<typeof cacheActions.addSucceeded>
  ) {
    yield* waitForAccount()
    const currentUserId = yield* call(queryCurrentUserId)
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
  const user = yield* call(queryUserByHandle, handle)

  if (!user) return

  const queryClient = yield* getContext('queryClient')

  queryClient.setQueryData(
    getUserComputedPropsQueryKey(user.user_id),
    (oldData: User | undefined) =>
      // TODO: is returning undefined correct? Whats the correct behavior here if cache miss occurs?
      oldData
        ? {
            ...oldData,
            twitter_handle: user.twitter_handle || null,
            instagram_handle: user.instagram_handle || null,
            tiktok_handle: user.tiktok_handle || null,
            website: user.website || null,
            donation: user.donation || null
          }
        : // No existing user (cache miss) means there's nothing to update
          undefined
  )
}

function* watchFetchUserSocials() {
  yield* takeEvery(userActions.FETCH_USER_SOCIALS, fetchUserSocials)
}

const sagas = () => {
  return [watchSyncLocalStorageUser, watchFetchUserSocials]
}

export default sagas
