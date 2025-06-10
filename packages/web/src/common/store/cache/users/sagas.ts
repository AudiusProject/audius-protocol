import { queryCurrentUserId } from '@audius/common/api'
import { Kind } from '@audius/common/models'
import { getContext, mergeCustomizer } from '@audius/common/store'
import { waitForAccount } from '@audius/common/utils'
import { mergeWith } from 'lodash'
import { call } from 'typed-redux-saga'

// For updates and adds, sync the account user to local storage.
// We use the same mergeCustomizer we use in cacheSagas to merge
// with the local state.

// TODO: replace this saga with a query client listener instead
function* watchSyncLocalStorageUser() {
  const localStorage = yield* getContext('localStorage')
  function* syncLocalStorageUser(action: any) {
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
  // yield* takeEvery(cacheActions.ADD_SUCCEEDED, syncLocalStorageUser)
  // yield* takeEvery(cacheActions.UPDATE, syncLocalStorageUser)
}

const sagas = () => {
  return [watchSyncLocalStorageUser]
}

export default sagas
